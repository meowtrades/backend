// filepath: /home/kunalrana/Desktop/intern/meowtrades/backend/src/core/services/chartDataTransformer.service.ts
export class ChartDataTransformer {
  static transformToChartData(
    data: { tokenAmount: number; usdValue: number }[]
  ): { x: number; y: number }[] {
    return data.map(entry => ({
      x: entry.tokenAmount, // Format timestamp for the x-axis
      y: entry.usdValue, // Use USD value for the y-axis
    }));
  }
}
