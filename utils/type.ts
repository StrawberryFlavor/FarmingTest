import { BigNumber } from "ethers";

export enum Operation {
    Stake = 0,
    Unstake = 1,
    ClaimRewards = 2
}

export type ContractAddress = string;
export type UserAddress = string;
export type Amount = number|string|BigNumber