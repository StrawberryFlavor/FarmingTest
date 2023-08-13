import { ethers } from "ethers";
import { UserAddress, ContractAddress, Amount, BlockNumber } from "../utils/type";

// ERC-20代币合约ABI的字符串表示
export const erc20ABI = [
    // symbol() 方法的ABI
    'function symbol() view returns (string)',

    'function decimals() view returns (uint8)',

    // name() 方法的ABI
    'function name() view returns (string)',

    'function balanceOf(address) view returns (uint256)',

    'function totalSupply() view returns (uint256)',

    'function transfer(address, uint256) returns (bool)',

    'function approve(address spender, uint256 amount) returns (bool)',
];

const erc20Iface = new ethers.utils.Interface(erc20ABI);

export class IERC20Call {
    erc20Contract: ethers.Contract
    constructor(contractAddress: ContractAddress, provider: ethers.providers.JsonRpcProvider | ethers.Wallet) {
        this.erc20Contract = new ethers.Contract(
            contractAddress,
            erc20ABI,
            provider
        );
    }

    async symbol() {
        return await this.erc20Contract.symbol()
    }

    async decimals() {
        return await this.erc20Contract.decimals()
    }

    async name() {
        return await this.erc20Contract.name()
    }

    async totalSupply(blockTag: BlockNumber = "latest") {
        return await this.erc20Contract.totalSupply({ blockTag })
    }

    async balanceOf(who: UserAddress, blockTag: BlockNumber = "latest") {
        return await this.erc20Contract.balanceOf(who, { blockTag })
    }

    async transfer(who: UserAddress, amount: Amount) {
        const tx = await this.erc20Contract.balanceOf(who, amount)
        await tx.wait()

        return tx
    }

    transferEncode(who: UserAddress, amount: Amount) {
        return erc20Iface.encodeFunctionData("transfer", [who, amount]);
    }
}