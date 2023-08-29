import { BigNumber } from "ethers";
import { DOT, LCDOT_13, LDOT, SA_DOT, WTDOT, } from "./config"

export type ContractAddress = string;
export type UserAddress = string;
export type Amount = number | string | BigNumber
export type BlockNumber = number | string

export enum Operation {
    Stake = 0,
    Unstake = 1,
    ClaimRewards = 2
}

export enum ConvertType {
    LCDOT2LDOT = 0,
    LCDOT2TDOT = 1,
    DOT2LDOT = 2,
    DOT2TDOT = 3,
    LCDOT2WTDOT = 4,
    DOT2WTDOT = 5
}
interface Conversion {
    from: ContractAddress;
    to: ContractAddress;
}

export const getConversion = (type: ConvertType): Conversion => {
    switch (type) {
      case ConvertType.LCDOT2LDOT:
        return { from: LCDOT_13 as string, to: LDOT as string };
      case ConvertType.LCDOT2TDOT:
        return { from: LCDOT_13 as string, to: SA_DOT as string };
      case ConvertType.DOT2LDOT:
        return { from: DOT as string, to: LDOT as string };
      case ConvertType.DOT2TDOT:
        return { from: DOT as string, to: SA_DOT as string };
      case ConvertType.LCDOT2WTDOT:
        return { from: LCDOT_13 as string, to: WTDOT as string };
      case ConvertType.DOT2WTDOT:
        return { from: DOT as string, to: WTDOT as string };
    }
}