import { expect } from "chai";

export const expectRevert = async (call: Promise<any>, errMsg: string) => {
    let flag = false;
    try {
        await call;
    } catch (err: any) {
        // console.log(err);
        
        expect(err.message).include(errMsg);
        flag = true;
    }
    expect(flag).true;
};