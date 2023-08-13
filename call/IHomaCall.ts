import { ethers } from "ethers";
import { HOMA } from "../utils/config";
import { Amount, BlockNumber } from "../utils/type";

const homaABI = [
    "function getCommissionRate() view returns (uint256)",

    "function getEstimatedRewardRate() view returns (uint256)",

    "function getExchangeRate() view returns (uint256)",

    "function getFastMatchFee() view returns (uint256)",

    "function mint(uint256 mintAmount) returns (bool)",

    "function requestRedeem(uint256 redeemAmount, bool fastMatch) returns (bool)",
]

const homaIface = new ethers.utils.Interface(homaABI);

export class IHomaCall {
    homaContract: ethers.Contract
    constructor(provider: ethers.providers.JsonRpcProvider | ethers.Wallet) {
        this.homaContract = new ethers.Contract(
            HOMA as string,
            homaABI,
            provider
        );
    }

    /**
     * 
     * @param blockTag 
     * @returns BigNumber
     */
    async getCommissionRate(blockTag: BlockNumber = "latest") {
        return await this.homaContract.getCommissionRate({ blockTag })
    }

    /**
     * 
     * @param blockTag 
     * @returns BigNumber
     */
    async getEstimatedRewardRate(blockTag: BlockNumber = "latest") {
        return await this.homaContract.getEstimatedRewardRate({ blockTag })
    }

    /**
     * 
     * @param blockTag 
     * @returns BigNumber
     */
    async getExchangeRate(blockTag: BlockNumber = "latest") {
        return await this.homaContract.getExchangeRate({ blockTag })
    }

    /**
     * 
     * @param blockTag 
     * @returns BigNumber
     */
    async getFastMatchFee(blockTag: BlockNumber = "latest") {
        return await this.homaContract.getFastMatchFee({ blockTag })
    }

    async mint(mintAmount: Amount) {
        const tx = await this.homaContract.mint(mintAmount)
        await tx.wait()
        return tx
    }

    async requestRedeem(redeemAmount: Amount, fastMatch: Boolean) {
        const tx = await this.homaContract.requestRedeem(redeemAmount, fastMatch)
        await tx.wait()
        return tx
    }

    mintEncode(mintAmount: Amount) {
        return homaIface.encodeFunctionData("mint", [mintAmount]);
    }

    requestRedeemEncode(redeemAmount: Amount, fastMatch: Boolean) {
        return homaIface.encodeFunctionData("requestRedeem", [redeemAmount, fastMatch]);
    }
}