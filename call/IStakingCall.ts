import { ethers } from "ethers";
import { AcalaJsonRpcProvider } from '@acala-network/eth-providers';
import UpgradeableStakingLSDABI from '../UpgradeableStakingLSD.json'
import { BLACK_HOLE, LIQUID_CROWDLOAN, PROXYCONTRACT } from "../utils/config";
import { Operation, UserAddress, ContractAddress, Amount, BlockNumber, ConvertType } from "../utils/type";
import { erc20ABI } from "./IERC20Call";

const stakingIface = new ethers.utils.Interface(UpgradeableStakingLSDABI);

export class IStakingCall {
    proxyContract: ethers.Contract
    constructor(provider: ethers.providers.JsonRpcProvider | ethers.Wallet | AcalaJsonRpcProvider) {
        this.proxyContract = new ethers.Contract(
            PROXYCONTRACT as string,
            UpgradeableStakingLSDABI,
            provider
        );
    }
    async DOT() {
        return await this.proxyContract.DOT();
    }

    async HOMA() {
        return await this.proxyContract.HOMA();
    }

    async LCDOT() {
        return await this.proxyContract.LCDOT();
    }

    async LDOT() {
        return await this.proxyContract.LDOT();
    }

    async WTDOT() {
        return await this.proxyContract.WTDOT()
    }

    async LIQUID_CROWDLOAN() {
        return await this.proxyContract.LIQUID_CROWDLOAN();
    }

    async MAX_REWARD_TYPES() {
        return await this.proxyContract.MAX_REWARD_TYPES();
    }

    async STABLE_ASSET() {
        return await this.proxyContract.STABLE_ASSET();
    }

    async TDOT() {
        return await this.proxyContract.TDOT();
    }

    /**
     * 获取下一个池的索引。它等于当前池的数量。
     * @returns BigNumber
     */
    async PoolIndex(blockTag: BlockNumber = "latest") {
        return await this.proxyContract.poolIndex({ blockTag });
    }

    /**
     * 查看用户在池子中的份额
     * @param poolId 池子的index
     * @param who 用户钱包地址
     * @returns BigNumber
     */
    async shares(poolId: number, who: UserAddress, blockTag: BlockNumber = "latest") {
        return await this.proxyContract.shares(poolId, who, { blockTag });
    }

    /**
     * 查看池子的总份额
     * @param poolId 池子的index
     * @returns BigNumber
     */
    async totalShares(poolId: number, blockTag: BlockNumber = "latest") {
        return await this.proxyContract.totalShares(poolId, { blockTag });
    }

    /**
     * 查看池子的共享类型 也就是查看是哪个erc20的池子
     * @param poolId 
     * @param blockTag 
     * @returns 
     */
    async shareTypes(poolId: number, blockTag: BlockNumber = "latest") {
        return await this.proxyContract.shareTypes(poolId, { blockTag });
    }

    /**
     * 查看用户未提取奖励
     * @param poolId 池子的index
     * @param who 用户钱包地址
     * @param rewardType 奖励币种的合约地址
     * @returns BigNumber
     */
    async earned(poolId: number, who: UserAddress, rewardType: ContractAddress, blockTag: BlockNumber = "latest") {
        return await this.proxyContract.earned(poolId, who, rewardType, { blockTag });
    }

    /**
     * 查看用户未领取奖励的情况
     * @param {number} poolId 池子的index
     * @param {string} who 用户钱包地址
     * @param {string} rewardType 奖励币种的合约地址
     * @returns 
     */
    async rewards(poolId: number, who: UserAddress, rewardType: ContractAddress, blockTag: BlockNumber = "latest") {
        return await this.proxyContract.rewards(poolId, who, rewardType, { blockTag });
    }

    /**
     * 获取池子的灼烧利率
     * @param poolId 池子的index
     * @returns BigNumber
     */
    async rewardsDeductionRates(poolId: number, blockTag: BlockNumber = "latest") {
        return await this.proxyContract.rewardsDeductionRates(poolId, { blockTag });
    }

    /**
     * 获取合约的归属人地址
     * @returns 用户地址
     */
    async owner(blockTag: BlockNumber = "latest") {
        return await this.proxyContract.owner({ blockTag });
    }

    /**
     * 获取合同是否暂停
     * @returns Boolean
     */
    async paused(blockTag: BlockNumber = "latest") {
        return await this.proxyContract.paused({ blockTag });
    }

    async rewardPerShare(poolId: number, rewardType: ContractAddress, blockTag: BlockNumber = "latest") {
        return await this.proxyContract.rewardPerShare(poolId, rewardType, { blockTag });
    }

    /**
     * 
     * @param poolId 要查询的池子index
     * @param rewardType 奖励币种的合约地址
     * @param blockTag 指定区块高度查询
     * @returns {rewardRate: 每秒奖励数量=rewardAmountAdd / rewardDuration,
     * endTime: 奖励持续时间=notifyRewardRule事件发生的时间 + rewardDuration,
     * rewardRateAccumulated, lastAccumulatedTime}
     */
    async rewardRules(poolId: number, rewardType: ContractAddress, blockTag: BlockNumber = "latest") {
        return await this.proxyContract.rewardRules(poolId, rewardType, { blockTag });
    }

    /**
     * 获取池子的reward奖励币种
     * @param poolId 要查询的池子index
     * @returns 币种地址Array[address]
     */
    async rewardTypes(poolId: number, blockTag: BlockNumber = "latest") {
        return await this.proxyContract.rewardTypes(poolId, { blockTag });
    }

    async lastTimeRewardApplicable(poolId: number, rewardType: ContractAddress, blockTag: BlockNumber = "latest") {
        return await this.proxyContract.lastTimeRewardApplicable(poolId, rewardType, { blockTag });
    }

    /**
     * 获取池子转化情况
     * @param {number} poolId 
     * @returns ConvertInfo {convertedShareType: address 币种地址, convertedExchangeRate: BigNumber}
     */
    async convertInfos(poolId: number, blockTag: BlockNumber = "latest") {
        return await this.proxyContract.convertInfos(poolId, { blockTag });
    }

    /**
     * 
     * @param poolId 池子index
     * @param who 用户钱包地址
     * @param rewardType 奖励币种的合约地址
     * @returns 
     */
    async paidAccumulatedRates(poolId: number, who: UserAddress, rewardType: ContractAddress, blockTag: BlockNumber = "latest") {
        return await this.proxyContract.paidAccumulatedRates(poolId, who, rewardType, { blockTag });
    }
    /**
     * 获取池子某个功能是否被禁用
     * @param {number} poolId 池子index
     * @param {number} operation 0: Stake, 1: Unstake, 2: ClaimRewards
     * @returns {Boolean}
     */
    async pausedPoolOperations(poolId: number, operation: Operation, blockTag: BlockNumber = "latest") {
        return await this.proxyContract.pausedPoolOperations(poolId, operation, { blockTag });
    }

    // --------------交易--------------
    // 初始化
    initializeEncode(
        dot: ContractAddress,
        lcdot: ContractAddress,
        ldot: ContractAddress,
        tdot: ContractAddress,
        homa: ContractAddress,
        stableAsset: ContractAddress,
        liquidCrowdloan: ContractAddress
    ) {
        return stakingIface.encodeFunctionData("initialize", [
            dot,
            lcdot,
            ldot,
            tdot,
            homa,
            stableAsset,
            liquidCrowdloan,
        ]);
    }

    async addPool(tokenAddress: ContractAddress) {
        const tx = await this.proxyContract.addPool(tokenAddress)
        await tx.wait()

        return tx
    }

    addPoolEncode(tokenAddress: ContractAddress) {
        // 构造一个调用 addPool 的 callData， 发起调用时， target 为 proxy 合约地址
        return stakingIface.encodeFunctionData("addPool", [tokenAddress]);
    }

    approveEncode(amount: Amount) {
        // erc20 授权 proxy 合约
        const erc20Iface = new ethers.utils.Interface(erc20ABI);
        return erc20Iface.encodeFunctionData("approve", [PROXYCONTRACT, amount]);
    }

    async stake(poolId: number, amount: Amount) {
        const tx = await this.proxyContract.stake(poolId, amount)
        await tx.wait()

        return tx
    }

    stakeEncode(poolId: number, amount: Amount) {
        return stakingIface.encodeFunctionData("stake", [poolId, amount]);
    }

    async unstake(poolId: number, amount: Amount) {
        const tx = await this.proxyContract.unstake(poolId, amount)
        await tx.wait()

        return tx
    }

    unstakeEncode(poolId: number, amount: Amount) {
        return stakingIface.encodeFunctionData("unstake", [poolId, amount]);
    }

    async convertLSDPool(poolId: number, convertType: ConvertType) {
        const tx = await this.proxyContract.convertLSDPool(poolId, convertType)
        await tx.wait()

        return tx
    }

    convertLSDPoolEncode(poolId: number, convertType: ConvertType) {
        return stakingIface.encodeFunctionData("convertLSDPool", [poolId, convertType]);
    }

    async claimRewards(poolId: number) {
        const tx = await this.proxyContract.claimRewards(poolId)
        await tx.wait()

        return tx
    }

    /**
     * 用于用户提取池子中的奖励，提取后会直接进入到奖励币种合约的用户钱包中
     * @param poolId 池子Index
     * @returns Boolean
     */
    claimRewardsEncode(poolId: number) {
        return stakingIface.encodeFunctionData("claimRewards", [poolId]);
    }

    async exit(poolId: number) {
        const tx = await this.proxyContract.exit(poolId)
        await tx.wait()

        return tx
    }

    /**
     * 取消所有股份，并从股份池中索取所有未认领的奖励。
     * @param poolId 池子Index
     * @returns Boolean
     */
    exitEncode(poolId: number) {
        return stakingIface.encodeFunctionData("exit", [poolId]);
    }

    async updateRewardRule(
        poolId: number,
        rewardType: ContractAddress,
        rewardRate: Amount,
        endTime: number|string
    ) {
        const tx = await this.proxyContract.updateRewardRule(
            poolId,
            rewardType,
            rewardRate,
            endTime,
        )
        await tx.wait()

        return tx
    }

    /**
     * 开启或调整池子的奖励规则，可通过rewardRules查询设置的奖励规则，
     * 用户所得奖励可以通过rewards查询
     * @param poolId 池子Index
     * @param rewardType 奖励币种的地址
     * @param rewardRate 每秒奖励
     * @param endTime 奖励结束时间 秒戳
     * @returns 
     */
    updateRewardRuleEncode(
        poolId: number,
        rewardType: ContractAddress,
        rewardRate: Amount,
        endTime: number|string
    ) {
        return stakingIface.encodeFunctionData("updateRewardRule", [
            poolId,
            rewardType,
            rewardRate,
            endTime,
        ]);
    }

    async pause() {
        const tx = await this.proxyContract.pause()
        await tx.wait()

        return tx
    }

    /**
     * 暂停整个合同的交易
     * @returns 
     */
    pauseEncode() {
        return stakingIface.encodeFunctionData("pause", []);
    }

    async unpause() {
        const tx = await this.proxyContract.unpause()
        await tx.wait()

        return tx
    }

    /**
     * 取消暂停整个合同的交易
     * @returns 
     */
    unpauseEncode() {
        return stakingIface.encodeFunctionData("unpause", []);
    }

    async setPoolOperationPause(poolId: number, operation: Operation, paused: Boolean) {
        const tx = await this.proxyContract.setPoolOperationPause(poolId, operation, paused)
        await tx.wait()

        return tx
    }

    /**
     * 单独设置某个池子的某个功能是否暂停
     * @param poolId 池子Index
     * @param operation 功能：Stake = 0, Unstake = 1, ClaimRewards = 2
     * @param paused 是否暂停 true暂停，false开启
     * @returns 
     */
    setPoolOperationPauseEncode(poolId: number, operation: Operation, paused: Boolean) {
        return stakingIface.encodeFunctionData("setPoolOperationPause", [poolId, operation, paused]);
    }

    async setRewardsDeductionRate(poolId: number, rate: Amount) {
        const tx = await this.proxyContract.setRewardsDeductionRate(poolId, rate)
        await tx.wait()

        return tx
    }

    /**
     * 设置池子的灼烧利率，用户提取奖励claimRewards时会扣除 当前设置的比例 rewardsAmount * (RewardsDeductionRate / 1e18)
     * @param poolId 池子Index
     * @param rate 100% * 1e18
     * @returns 
     */
    setRewardsDeductionRateEncode(poolId: number, rate: Amount) {
        return stakingIface.encodeFunctionData("setRewardsDeductionRate", [poolId, rate]);
    }

    async transferOwnership(newOwner: UserAddress) {
        const tx = await this.proxyContract.transferOwnership(newOwner)
        await tx.wait()

        return tx
    }

    /**
     * 转让合约所有权
     * @param newOwner 合约接受人地址
     * @returns 
     */
    transferOwnershipEncode(newOwner: UserAddress) {
        return stakingIface.encodeFunctionData("transferOwnership", [newOwner]);
    }
}
