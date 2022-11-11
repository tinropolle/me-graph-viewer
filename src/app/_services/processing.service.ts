import { Injectable } from '@angular/core';
import { Config } from '../_model/config';
import { Edge } from '../_model/edge';
import { Graph } from '../_model/graph';
import { Node } from '../_model/node';
import { ConfigurationService } from './configuration.service';

@Injectable({
  providedIn: 'root'
})
export class ProcessingService {
  config: Config;

  constructor(private configService: ConfigurationService) {
    this.config = configService.config;
  }

  tryParse(rawString: string): Graph {
    try {
      const graph: Graph = JSON.parse(rawString);
      const valid = this.validate(graph);
      if (valid) {
        // Set selected
        const preSelectedNode = graph.nodes.find(n => n.group);
        if (preSelectedNode) {
          preSelectedNode.isChecked = true;
        }
        // Save accepted graph to current
        return this.optimize(graph);
      } else {
        console.log("Invalid data provided");
      }
    } catch (error) {
      console.log("Error while parsing raw data");
      console.log(error);
    }
  }

  exceedsTheRange(x1: number, x2: number, xc: number) {
    return (x1 <= x2 && (xc < x1 || xc > x2)) ||
           (x1 >= x2 && (xc > x1 || xc < x2));
  }

  findTochingPoint(node: Node, edge: Edge) {
    const vert = [
      { x: node.x - this.config.objectWidth / 2, y: node.y - node.height / 2 },
      { x: node.x - this.config.objectWidth / 2, y: node.y + node.height / 2 },
      { x: node.x + this.config.objectWidth / 2, y: node.y + node.height / 2 },
      { x: node.x + this.config.objectWidth / 2, y: node.y - node.height / 2 }
    ];
    const intersections = [];
    let minDistance = Number.MAX_VALUE;
    let minDistanceIndex = -1;
    for (let i = 0; i < 4; i++) {
      const inters = this.intersect(
        edge.fromX, edge.fromY, edge.toX, edge.toY,
        vert[i].x, vert[i].y, vert[(i == 3) ? 0 : i + 1].x, vert[(i == 3) ? 0 : i + 1].y
      );
      if (inters == null) continue;
      intersections.push(inters);
      const dist = Math.sqrt(Math.pow(inters.x - node.x, 2) + Math.pow(inters.y - node.y, 2));
      if (dist <= minDistance) {
        minDistance = dist;
        minDistanceIndex = i;
      }
    }
    if (intersections.length > 0) {
      if (edge.from === node.id) {
        edge.fromX = intersections[0].x;
        edge.fromY = intersections[0].y;
      } else {
        edge.toX = intersections[0].x;
        edge.toY = intersections[0].y;
      }
    }
  }

  intersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): { x: number, y: number} {
    // Check if none of the lines are of length 0
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) return null;
    let denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

    // Lines are parallel
    if (denominator === 0) return null

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

    // Is the intersection along the segments
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;

    // Return a object with the x and y coordinates of the intersection
    let x = x1 + ua * (x2 - x1)
    let y = y1 + ua * (y2 - y1)

    return { x, y }
  }

  configureEdges(nodes: Node[], edges: Edge[]) {
    // Configure basic cuts
    for (const key in nodes) {
      for (const edgeKey in edges) {
        if (edges[edgeKey].from == nodes[key].id) {
          edges[edgeKey].fromX = nodes[key].x;
          edges[edgeKey].fromY = nodes[key].y;
        } else if (edges[edgeKey].to == nodes[key].id) {
          edges[edgeKey].toX = nodes[key].x;
          edges[edgeKey].toY = nodes[key].y;
        }
      }
    }

    // Adopt to object's border
    for (const key in nodes) {
      for (const edgeKey in edges) {
        if (edges[edgeKey].from == nodes[key].id || edges[edgeKey].to == nodes[key].id) {
          this.findTochingPoint(nodes[key], edges[edgeKey]);
        }
      }
    }
  }

  getGroupsByLevel(nodes: Node[]): Array<Array<Node>> {
    const groups = new Array<Array<Node>>();
    for (const key in nodes) {
      if (!groups[nodes[key].level]) {
        groups[nodes[key].level] = [];
      }
      groups[nodes[key].level].push(nodes[key]);
    }
    return groups;
  }

  getGroupsByName(groups: Array<Array<Node>>): Array<Array<Array<Node>>> {
    const nameGroups = new Array<Array<Array<Node>>>();
    for (const key in groups) {
      nameGroups[key] = [];
      for (const node in groups[key]) {
        let prefix = "Other";
        const pattern = /[^:]+: ([^_]+)_/g;
        const match = pattern.exec(groups[key][node].label);
        if (match && match.length == 2) {
          prefix = match[1];
        }

        if (!nameGroups[key][prefix]) {
          nameGroups[key][prefix] = [];
        }
        nameGroups[key][prefix].push(groups[key][node]);
      }
    }
    return nameGroups;
  }

  sortGroupsByIndex(groups: Array<Array<Node>>) {
    for (const key in groups) {
      groups[key].sort((a, b) => a.index - b.index);
    }
  }

  sortGroupsByName(groups: Array<Array<Node>>) {
    for (const key in groups) {
      groups[key].sort((a, b) => a.label.localeCompare(b.label));
    }
  }

  reshapeGroup(initX: number, group: Array<Node>, maxRows: number) {
    let initY = 0;
    if (group) {
      const groupHeight = ((group.length > maxRows) ? maxRows : group.length) * this.config.objectIntervalYInGroup;
      let initY = -groupHeight / 2;
      for (const key in group) {
        group[key].x = initX;
        group[key].y = initY;
        initY += this.config.objectIntervalYInGroup;

        if (initY > groupHeight / 2) {
          initX += this.config.objectIntervalXInGroup;
          initY = -groupHeight / 2;
        }
      }
    }
    return initX += this.config.objectIntervalX;
  }

  reshapeGroupByName(initX: number, group: Array<Array<Node>>, maxRows: number) {
    let subGroupCount = 0;
    for (const key in group) {
      subGroupCount++;
    }

    console.log('Sub group count: ' + subGroupCount);

    const groupHeights = {};
    let totalHeight = 0;
    for (const subGroupKey in group) {
      const groupHeight =
        ((group[subGroupKey].length > Math.floor(maxRows / subGroupCount)) ? Math.floor(maxRows / subGroupCount) : group[subGroupKey].length)
        * this.config.objectIntervalYInGroup;
      groupHeights[subGroupKey] = groupHeight;
      totalHeight += groupHeight;
    }
    totalHeight += (subGroupCount - 1) * this.config.objectIntervalY;

    console.log(maxRows / subGroupCount);
    console.log(groupHeights);
    console.log(totalHeight);

    let initY = -totalHeight / 2;
    let globalX = initX;
    let globalY = initY;
    let maxColumns = 0;
    for (const subGroupKey in group) {
      let columns = 1;
      if (group[subGroupKey]) {
        for (const key in group[subGroupKey]) {
          group[subGroupKey][key].x = globalX;
          group[subGroupKey][key].y = globalY;
          globalY += this.config.objectIntervalYInGroup;
  
          if (globalY > initY + groupHeights[subGroupKey]) {
            columns++;
            globalX += this.config.objectIntervalXInGroup;
            globalY = globalY - groupHeights[subGroupKey] - this.config.objectIntervalYInGroup;
          }
        }
        if (columns > maxColumns) {
          maxColumns = columns;
        }
      }
      globalX = initX;
      initY += groupHeights[subGroupKey] + this.config.objectIntervalY;
      globalY = initY;
    }

    return initX + maxColumns * this.config.objectIntervalX;
  }

  generateLabels(nodes: Node[]) {
    for (const key in nodes) {
      if (!nodes[key].labels) {
        nodes[key].labels = this.parseLabels(nodes[key]);
        nodes[key].height = this.config.rowHeight * (nodes[key].labels || []).length;
      }
    }
  }

  optimize(graph: Graph): Graph {
    // Generate texts
    this.generateLabels(graph.nodes);
  
    // Group
    const groups = this.getGroupsByLevel(graph.nodes);
    this.sortGroupsByIndex(groups);
    this.sortGroupsByName(groups);

    // Reshape
    let initX = 0;
    for (const key in groups) {
      initX = this.reshapeGroup(initX, groups[key], Number.MAX_VALUE /* 2 * (groups.length - 1) | Number.MAX_VALUE */);
    }

    // Configure edges
    this.configureEdges(graph.nodes, graph.edges);

    // Calc size parameters
    graph.height = Math.max(...graph.nodes.map(n => n.y)) - Math.min(...graph.nodes.map(n => n.y));
    graph.width = Math.max(...graph.nodes.map(n => n.x)) - Math.min(...graph.nodes.map(n => n.x));
    console.log(`Graph size: ${graph.width} x ${graph.height}`);

    return graph;
  }

  parseLabels(node: Node): string[] {
    const nodeTypeConfig = this.configService.nodeTypeConfig[node.nodeType];
    if (nodeTypeConfig) {
      if (nodeTypeConfig.label) {
        return [nodeTypeConfig.label];
      } else {
        const pattern = new RegExp(nodeTypeConfig.regexp, "g");
        const match = pattern.exec(node.label);
        if (match && match.length == nodeTypeConfig.length + 1) {
          return match.splice(1);
        } else {
          console.log(node);
          throw new Error("Pattern doesn't match");
        }
      }
    } else {
      console.log(node);
      throw new Error("No config for node");
    }
  }

  validate(graph: Graph): boolean {
    let errorCount: number = 0;
    if (graph.edges && graph.nodes) {
      for (const key in graph.edges) {
        if (!(
          graph.edges[key].from && typeof(graph.edges[key].from) == 'string' &&
          graph.edges[key].to && typeof(graph.edges[key].to) == 'string')) {
          // graph.edges[key].title && typeof(graph.edges[key].title) == 'string')) {
            errorCount++;
            console.log("Edge property is missing");
            console.log(graph.edges[key]);
        }
      }
      for (const key in graph.nodes) {
        if (!(
          graph.nodes[key].id && typeof(graph.nodes[key].id) == 'string' &&
          graph.nodes[key].nodeType && typeof(graph.nodes[key].nodeType) == 'string' &&
          graph.nodes[key].url && typeof(graph.nodes[key].url) == 'string' &&
          graph.nodes[key].label && typeof(graph.nodes[key].label) == 'string' &&
          graph.nodes[key].level && typeof(graph.nodes[key].level) == 'number' &&
          graph.nodes[key].index && typeof(graph.nodes[key].index) == 'number' &&
          // graph.nodes[key].group && typeof(graph.nodes[key].group) == 'string' &&
          graph.nodes[key].x && typeof(graph.nodes[key].x) == 'number' &&
          graph.nodes[key].y && typeof(graph.nodes[key].y) == 'number')) {
            errorCount++;
            console.log("Node property is missing");
            console.log(graph.nodes[key]);
        }
      }
    } else {
      errorCount++;
    }
    return errorCount == 0;
  }
}
