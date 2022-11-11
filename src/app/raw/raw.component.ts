import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ProcessingService } from '../_services/processing.service';
import graph1 from '../../assets/graph1.json';
import graph1_1 from '../../assets/graph1_1.json';
import graph2 from '../../assets/graph2.json';
import { Graph } from '../_model/graph';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-raw',
  templateUrl: './raw.component.html',
  styleUrls: ['./raw.component.css']
})
export class RawComponent implements OnInit, AfterViewInit {
  @Output() graph: EventEmitter<Graph> = new EventEmitter();
  @ViewChild('rawInput') rawInput: ElementRef;
  rawData: string;

  isCollapsed: boolean = true;
  isLoading: boolean = false;
  isValid: boolean = true;

  constructor(private processing: ProcessingService, private toastr: ToastrService) { }

  ngAfterViewInit(): void {
    this.onRawChange(JSON.stringify(graph1));
  }

  ngOnInit(): void {
  }

  onRawChange(value: string) {
    this.isLoading = true;
    this.isValid = false;
    // Beautify the input element
    try {
      const ugly = value;
      const newSource = JSON.parse(ugly);
      this.rawData = JSON.stringify(newSource, undefined, 4);
    } catch (error) {
      this.toastr.error("Wrong JSON format provided");
      this.isLoading = false;
      return;
    }
    // Update actual data
    const newGraph = this.processing.tryParse(value);
    if (newGraph) {
      this.graph.emit(newGraph);
      this.isValid = true;
      // this.toastr.success("New graph successfully loaded");
    } else {
      this.toastr.warning("Error during graph recognition process. Go to Console for more info");
    }
    this.isLoading = false;
  }

  toggleCollapsed() {
    this.isCollapsed = !this.isCollapsed;
  }
}
