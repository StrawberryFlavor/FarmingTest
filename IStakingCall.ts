import { ethers } from "ethers";
import UpgradeableStakingLSDABI from './UpgradeableStakingLSD.json'
import {PROXYCONTRACT} from "./utils/config";
// proxy 合约

const iface = new ethers.utils.Interface(UpgradeableStakingLSDABI);

// ERC-20代币合约ABI的字符串表示
const erc20ABI = [
    // symbol() 方法的ABI
    'function symbol() view returns (string)',

    // name() 方法的ABI
    'function name() view returns (string)',

    'function balanceOf(address) view returns (uint256)',

    'function transfer(address, uint256) returns (bool)',

    'function approve(address spender, uint256 amount) returns (bool)',
];

export function approve(amount: string){
    // erc20 授权 proxy 合约
    const erc20Iface = new ethers.utils.Interface(erc20ABI);
    return erc20Iface.encodeFunctionData('approve', [PROXYCONTRACT, amount]);
}


export function stake(poolId: number, amount: string){
    return  iface.encodeFunctionData('stake', [poolId, amount]);
}

export function addPool(tokenAddress: string){
    // 构造一个调用 addPool 的 callData， 发起调用时， target 为 proxy 合约地址
    return iface.encodeFunctionData('addPool', [tokenAddress]);
}

export function unstake(poolId: number, amount: string){
    return  iface.encodeFunctionData('unstake', [poolId, amount]);
}

export function claimReward(poolId: number, amount: string){
    return iface.encodeFunctionData('claimReward', [poolId, amount]);
}


