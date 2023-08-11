import { BigNumber } from "ethers";

export enum Operation {
    Stake = 0,
    Unstake = 1,
    ClaimRewards = 2
}

export enum ConvertType {
    LCDOT2LDOT = 0,
    LCDOT2TDOT = 1,
    DOT2LDOT = 2,
    DOT2TDOT = 3
}

export type ContractAddress = string;
export type UserAddress = string;
export type Amount = number|string|BigNumber
export type BlockNumber = number|string