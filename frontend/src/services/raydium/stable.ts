import { PublicKey } from '@solana/web3.js'
import { struct, u64 } from '@project-serum/borsh'

export const ModelDataPubkey = new PublicKey('CDSr3ssLcRB6XYPJwAfFt18MZvEZp4LjHcvzBVZ45duo')
const ELEMENT_SIZE = 50500

// Helper for sequence arrays since @project-serum/borsh doesn't have seq
const seq = (type: any, len: number, property: string) => {
  const array = [...Array(len)].map(() => type)
  return struct(array, property)
}

export const DataElement = struct([u64('x'), u64('y'), u64('price')])

export const ModelDataInfo = struct([
  u64('accountType'),
  u64('status'),
  u64('multiplier'),
  u64('validDataCount'),
  seq(DataElement, ELEMENT_SIZE, 'DataElement'),
])

export interface StableModelLayout {
  accountType: number
  status: number
  multiplier: number
  validDataCount: number
  DataElement: { x: number; y: number; price: number }[]
}

// Export the key functions needed
export function formatLayout(buffer: Buffer): StableModelLayout {
  const layoutInfo = ModelDataInfo.decode(buffer)
  return {
    accountType: layoutInfo.accountType.toNumber(),
    status: layoutInfo.status.toNumber(),
    multiplier: layoutInfo.multiplier.toNumber(),
    validDataCount: layoutInfo.validDataCount.toNumber(),
    DataElement: layoutInfo.DataElement.map((item: any) => ({
      x: item.x.toNumber(),
      y: item.y.toNumber(),
      price: item.price.toNumber(),
    })),
  }
}

export function getDyByDxBaseIn(layoutData: StableModelLayout, xReal: number, yReal: number, dxReal: number): number {
  const validData = layoutData.DataElement.slice(0, layoutData.validDataCount);
  
  // Find the appropriate curve segment
  let i = 0;
  while (i < validData.length - 1 && validData[i + 1].x <= xReal + dxReal) {
    i++;
  }
  
  if (i >= validData.length - 1) {
    return 0; // Out of range
  }
  
  // Linear interpolation for price
  const x1 = validData[i].x;
  const y1 = validData[i].y;
  const price1 = validData[i].price;
  
  const x2 = validData[i + 1].x;
  const y2 = validData[i + 1].y;
  const price2 = validData[i + 1].price;
  
  // Calculate average price for this segment
  const avgPrice = (price1 + price2) / 2;
  
  // Calculate dy based on dx and price
  return dxReal * avgPrice;
}

export function getDxByDyBaseIn(layoutData: StableModelLayout, xReal: number, yReal: number, dyReal: number): number {
  const validData = layoutData.DataElement.slice(0, layoutData.validDataCount);
  
  // Find the appropriate curve segment
  let i = 0;
  while (i < validData.length - 1 && validData[i + 1].y <= yReal + dyReal) {
    i++;
  }
  
  if (i >= validData.length - 1) {
    return 0; // Out of range
  }
  
  // Linear interpolation for price
  const x1 = validData[i].x;
  const y1 = validData[i].y;
  const price1 = validData[i].price;
  
  const x2 = validData[i + 1].x;
  const y2 = validData[i + 1].y;
  const price2 = validData[i + 1].price;
  
  // Calculate average price for this segment
  const avgPrice = (price1 + price2) / 2;
  
  // Calculate dx based on dy and price
  return dyReal / avgPrice;
}

export function getStablePrice(layoutData: StableModelLayout, coinReal: number, pcReal: number, baseCoin: boolean): number {
  const validData = layoutData.DataElement.slice(0, layoutData.validDataCount);
  
  // Find the appropriate curve segment
  let i = 0;
  while (i < validData.length - 1 && validData[i + 1].x <= coinReal) {
    i++;
  }
  
  if (i >= validData.length - 1) {
    return validData[validData.length - 1].price; // Use last price
  }
  
  // Linear interpolation for price
  const x1 = validData[i].x;
  const price1 = validData[i].price;
  
  const x2 = validData[i + 1].x;
  const price2 = validData[i + 1].price;
  
  // Calculate interpolated price
  const ratio = (coinReal - x1) / (x2 - x1);
  return price1 + ratio * (price2 - price1);
}