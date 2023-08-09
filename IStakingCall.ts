import { ethers } from "ethers";
import UpgradeableStakingLSDABI from './UpgradeableStakingLSD.json'
import { PROXYCONTRACT } from "./utils/config";
import { Operation, UserAddress, ContractAddress, Amount } from "./utils/type";



const iface = new ethers.utils.Interface(UpgradeableStakingLSDABI);
export const provider = new ethers.providers.JsonRpcProvider(
    "https://crosschain-dev.polkawallet.io:9909"
);
export const ProxyContract = new ethers.Contract(
    PROXYCONTRACT as string,
    UpgradeableStakingLSDABI,
    provider
);

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

export class IStakingCall {
    async DOT() {
        return await ProxyContract.DOT();
    }
    
    async HOMA() {
        return await ProxyContract.HOMA();
    }
    
    async LCDOT() {
        return await ProxyContract.LCDOT();
    }
    
    async LDOT() {
        return await ProxyContract.LDOT();
    }
    
    async LIQUID_CROWDLOAN() {
        return await ProxyContract.LIQUID_CROWDLOAN();
    }
    
    async MAX_REWARD_TYPES() {
        return await ProxyContract.MAX_REWARD_TYPES();
    }
    
    async STABLE_ASSET() {
        return await ProxyContract.STABLE_ASSET();
    }
    
    async TDOT() {
        return await ProxyContract.TDOT();
    }
    
    async getPoolIndex() {
        return await ProxyContract.poolIndex();
    }
    
    async shares(poolId: number, who: UserAddress) {
        return await ProxyContract.shares(poolId, who);
    }
    
    async totalShares(poolId: number) {
        return await ProxyContract.totalShares(poolId);
    }
    
    async shareTypes(poolId: number) {
        return await ProxyContract.shareTypes(poolId);
    }
    
    async earned(poolId: number, who: UserAddress, rewardType: ContractAddress) {
        return await ProxyContract.earned(poolId, who, rewardType);
    }
    /**
     * 查看用户未领取奖励的情况
     * @param {number} poolId 池子的index
     * @param {string} who 钱包地址
     * @param {string} rewardType 奖励币种的合约地址
     * @returns 
     */
    async rewards(poolId: number, who: UserAddress, rewardType: ContractAddress) {
        return await ProxyContract.rewards(poolId, who, rewardType);
    }
    
    async rewardsDeductionRates(poolId: number) {
        return await ProxyContract.rewardsDeductionRates(poolId);
    }
    
    async owner() {
        return await ProxyContract.owner();
    }
    
    async paused() {
        return await ProxyContract.paused();
    }
    
    async rewardPerShare(poolId: number, rewardType: ContractAddress) {
        return await ProxyContract.rewardPerShare(poolId, rewardType);
    }
    
    async rewardRules(poolId: number, rewardType: ContractAddress) {
        return await ProxyContract.rewardRules(poolId, rewardType);
    }
    
    async rewardTypes(poolId: number) {
        return await ProxyContract.rewardTypes(poolId);
    }
    
    async lastTimeRewardApplicable(poolId: number, rewardType: ContractAddress) {
        return await ProxyContract.lastTimeRewardApplicable(poolId, rewardType);
    }
    
    /**
     * 获取池子转化情况
     * @param {number} poolId 
     * @returns ConvertInfo
     */
    async convertInfos(poolId: number) {
        return await ProxyContract.convertInfos(poolId);
    }
    
    async paidAccumulatedRates(poolId: number, who: UserAddress, rewardType: ContractAddress) {
        return await ProxyContract.paidAccumulatedRates(poolId, who, rewardType);
    }
    /**
     * 
     * @param {number} poolId 
     * @param {number} operation 0: Stake, 1: Unstake, 2: ClaimRewards
     * @returns {Boolean}
     */
    async pausedPoolOperations(poolId: number, operation: Operation) {
        return await ProxyContract.pausedPoolOperations(poolId, operation);
    }

    // 交易
    // 初始化
    initialize(
        dot: ContractAddress,
        lcdot: ContractAddress,
        ldot: ContractAddress,
        tdot: ContractAddress,
        homa: ContractAddress,
        stableAsset: ContractAddress,
        liquidCrowdloan: ContractAddress
    ) {
        return iface.encodeFunctionData("initialize", [
            dot,
            lcdot,
            ldot,
            tdot,
            homa,
            stableAsset,
            liquidCrowdloan,
        ]);
    }
    
    addPool(tokenAddress: ContractAddress) {
        // 构造一个调用 addPool 的 callData， 发起调用时， target 为 proxy 合约地址
        return iface.encodeFunctionData("addPool", [tokenAddress]);
    }
    
    approve(amount: Amount) {
        // erc20 授权 proxy 合约
        const erc20Iface = new ethers.utils.Interface(erc20ABI);
        return erc20Iface.encodeFunctionData("approve", [PROXYCONTRACT, amount]);
    }
    
    stake(poolId: number, amount: Amount) {
        return iface.encodeFunctionData("stake", [poolId, amount]);
    }
    
    unstake(poolId: number, amount: Amount) {
        return iface.encodeFunctionData("unstake", [poolId, amount]);
    }
    
    claimReward(poolId: number, amount: Amount) {
        return iface.encodeFunctionData("claimReward", [poolId, amount]);
    }
    
    convertLSDPool(poolId: number, convertType: ContractAddress) {
        return iface.encodeFunctionData("convertLSDPool", [poolId, convertType]);
    }
    
    exit(poolId: number) {
        return iface.encodeFunctionData("exit", [poolId]);
    }
    
    notifyRewardRule(
        poolId: number,
        rewardType: ContractAddress,
        rewardAmountAdd: Amount,
        rewardDuration: number
    ) {
        return iface.encodeFunctionData("notifyRewardRule", [
            poolId,
            rewardType,
            rewardAmountAdd,
            rewardDuration,
        ]);
    }
    
    pause() {
        return iface.encodeFunctionData("pause", []);
    }
    
    unpause() {
        return iface.encodeFunctionData("unpause", []);
    }
    
    setPoolOperationPause(poolId: number, operation: Operation, paused: Boolean) {
        return iface.encodeFunctionData("setPoolOperationPause", [poolId, operation, paused]);
    }
    
    setRewardsDeductionRate(poolId: number, rate: Amount) {
        return iface.encodeFunctionData("setRewardsDeductionRate", [poolId, rate]);
    }
    
    transferOwnership(newOwner: UserAddress) {
        return iface.encodeFunctionData("transferOwnership", [newOwner]);
    }
}

export const iStakingCall = new IStakingCall()