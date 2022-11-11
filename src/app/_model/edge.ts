export interface Edge {
    from: string;
    to: string;
    title: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;

    isFromChecked: boolean;
    isToChecked: boolean;
    
    isFromHidden: boolean;
    isToHidden: boolean;
}
