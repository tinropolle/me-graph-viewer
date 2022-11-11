import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Graph } from '../_model/graph';
import { ProcessingService } from '../_services/processing.service';
import { Node } from "../_model/node";

@Component({
  selector: 'app-object-list',
  templateUrl: './object-list.component.html',
  styleUrls: ['./object-list.component.css']
})
export class ObjectListComponent implements OnInit {
  @Input() nodes: Node[] = [];
  @Output() mouseOver: EventEmitter<string> = new EventEmitter();
  @Output() filterNodes: EventEmitter<string> = new EventEmitter();
  @Output() checkAllNodes: EventEmitter<boolean> = new EventEmitter();
  @Output() checkNode: EventEmitter<string> = new EventEmitter();
  @Output() hideCheckedNodes: EventEmitter<boolean> = new EventEmitter();
  @Output() selectNode: EventEmitter<string> = new EventEmitter();
  @ViewChild('objectListFilter') objectListFilter: ElementRef;

  isCollapsed: boolean = true;
  filterText: string = '';

  constructor(public processing: ProcessingService) { }

  ngOnInit(): void {
  }

  hover(id: string) {
    this.mouseOver.emit(id);
  }

  mouseLeaveNode() {
    this.mouseOver.emit("");
  }

  check(id: string) {
    this.checkNode.emit(id);
  }

  checkAll(event: InputEvent) {
    this.checkAllNodes.emit((event.target as HTMLInputElement).checked);
  }

  onClearFilter() {
    this.objectListFilter.nativeElement.value = '';
    this.onFilterChangeTo('');
  }
  
  onFilterChange(event: InputEvent) {
    this.onFilterChangeTo((event.target as HTMLInputElement).value);
  }

  onFilterChangeTo(filter: string) {
    this.filterText = filter;
    this.filterNodes.emit(this.filterText);
  }

  onHideCheckedNodes() {
    this.hideCheckedNodes.emit(true);
  }

  onShowCheckedNodes() {
    this.hideCheckedNodes.emit(false);
  }

  select(id: string) {
    this.selectNode.emit(id);
  }

  toggleCollapsed() {
    this.isCollapsed = !this.isCollapsed;
  }
}
