export type Chartable = {
  x: number;
  y: number;
};

export interface Transformer {
  transform: (data: any) => Promise<any>;
}
