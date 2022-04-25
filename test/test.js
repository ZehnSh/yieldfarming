const {expect} =  require("chai");
const {ethers} = require("hardhat");
const {time} = require("@openzeppelin/test-helpers")


describe("PkmnFarm",function(){

    let owner;
    let alice;
    let bob;
    let res;
    let pmknFarm;
    let pmknToken;
    let daiToken;

    const daiAmount = ethers.utils.parseEther("25000");


    beforeEach(async function(){

        
        const PmknToken = await hre.ethers.getContractFactory("PmknToken");
        const DaiToken = await hre.ethers.getContractFactory("DaiToken");
        const PmknFarm = await hre.ethers.getContractFactory("PmknFarm");
        [owner,alice,bob] = await ethers.getSigners();

       pmknToken = await PmknToken.deploy();
       daiToken = await DaiToken.deploy();
       pmknFarm = await PmknFarm.deploy(daiToken.address,pmknToken.address);

       await pmknToken.deployed();
       await daiToken.deployed();
       await pmknFarm.deployed();

       await Promise.all([
        daiToken.mint(owner.address, daiAmount),
        daiToken.mint(alice.address, daiAmount),
        daiToken.mint(bob.address, daiAmount)
    ]);

   
    })


  
    it("Initialisation",async function(){

        expect(pmknToken).to.be.ok
        expect(pmknFarm).to.be.ok
        expect(daiToken).to.be.ok

    });

        it("Should Accept Dai and update mapping", async function(){
        let toTransfer = ethers.utils.parseEther("100");
        await daiToken.connect(alice).approve(pmknFarm.address,toTransfer);

        expect(await pmknFarm.isStaking(alice.address)).to.equal(false);

        expect(await pmknFarm.connect(alice).stake(toTransfer)).to.be.ok;

        expect(await pmknFarm.stakingBalance(alice.address)).to.equal(toTransfer);

        expect(await pmknFarm.isStaking(alice.address)).to.equal(true);
    });

    it("should update balance with multiple stakes", async function() {
        let toTransfer = ethers.utils.parseEther("100")
        await daiToken.connect(alice).approve(pmknFarm.address, toTransfer)
        await pmknFarm.connect(alice).stake(toTransfer)

        await daiToken.connect(alice).approve(pmknFarm.address, toTransfer)
        await pmknFarm.connect(alice).stake(toTransfer)

        expect(await pmknFarm.stakingBalance(alice.address))
            .to.equal(ethers.utils.parseEther("200"))
    });

    it("should revert with not enough funds", async() => {
        let toTransfer = ethers.utils.parseEther("1000000")
        await daiToken.connect(bob).approve(pmknFarm.address, toTransfer)

        console.log(await daiToken.allowance(bob.address,pmknFarm.address));

        await expect(pmknFarm.connect(bob).stake(toTransfer))
            .to.be.revertedWith("You cannot stake zero tokens") 
    });


    describe("Unstake", async function() {

        beforeEach(async function() {
            let toTransfer = ethers.utils.parseEther("100")
            await daiToken.connect(alice).approve(pmknFarm.address, toTransfer)
            await pmknFarm.connect(alice).stake(toTransfer)
        })
    
        it("should unstake balance from user", async function() {
            let toTransfer = ethers.utils.parseEther("100")
            await pmknFarm.connect(alice).unstake(toTransfer)
    
            res = await pmknFarm.stakingBalance(alice.address)
            expect(Number(res))
                .to.eq(0)
    
            expect(await pmknFarm.isStaking(alice.address))
                .to.eq(false)
        })
    });



    describe("WithdrawYield", async function() {
        beforeEach(async function() {
            await pmknToken.setRole(pmknFarm.address)
            let toTransfer = ethers.utils.parseEther("10")
            await daiToken.connect(alice).approve(pmknFarm.address, toTransfer)
            await pmknFarm.connect(alice).stake(toTransfer)
        })

        it("should return correct yield time", async() => {
            let timeStart = await pmknFarm.startTime(alice.address)
            expect(Number(timeStart))
                .to.be.greaterThan(0)
                console.log( await pmknFarm.calculateYieldTime(alice.address))

            await time.increase(86400)

            console.log(await pmknFarm.calculateYieldTime(alice.address))

            expect(await pmknFarm.calculateYieldTime(alice.address))
                .to.eq((86400))
        })

        it("should mint correct token amount in total supply and user", async() => { 
            await time.increase(86400)

            let _time = await pmknFarm.calculateYieldTime(alice.address)
            let formatTime = _time / 86400
            console.log(formatTime)
            let staked = await pmknFarm.stakingBalance(alice.address)
            console.log(staked)
            let bal = staked * formatTime
            console.log(bal)
            let newBal = ethers.utils.formatEther(bal.toString())
            console.log((newBal))
            let expected = Number.parseFloat(newBal).toFixed(3)
            console.log(expected)

            await pmknFarm.connect(alice).withdrawYield()

            res = await pmknToken.totalSupply()
            let newRes = ethers.utils.formatEther(res)
            let formatRes = Number.parseFloat(newRes).toFixed(3).toString()

            expect(expected)
                .to.eq(formatRes)

            res = await pmknToken.balanceOf(alice.address)
            newRes = ethers.utils.formatEther(res)
            formatRes = Number.parseFloat(newRes).toFixed(3).toString()

            expect(expected)
                .to.eq(formatRes)
        })

        it("should update yield balance when unstaked", async() => {
            await time.increase(86400)
            await pmknFarm.connect(alice).unstake(ethers.utils.parseEther("5"))

            res = await pmknFarm.pmknBalance(alice.address)
            expect(Number(ethers.utils.formatEther(res)))
                .to.be.approximately(10, .001)
        })

      
    });







})

