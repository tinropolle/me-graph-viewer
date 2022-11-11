export interface Node {
    id: string;
    nodeType: string;
    url: string;
    label: string;
    level: number;
    index: number;
    group: string;
    x: number;
    y: number;

    height: number;
    isChecked: boolean;
    isHidden: boolean;
    isSelected: boolean;
    labels: string[];
}
