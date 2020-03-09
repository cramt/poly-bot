import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import * as Commands from '../src/commands';
import * as CommandParser from '../src/Command';

chai.use(chaiAsPromised)
const expect = chai.expect

/*describe('String exclude', () => {

    it('Excluded string', () => {
        let stringArg = new CommandParser.StringExcludedArgument("excluded");
        assert.throws(async() => {await stringArg.parse("Contains excluded")}, CommandParser.ArgumentError);
    })
})*/

describe('Number Arguments', () => {
    it('Invalid number', async () => {
        let cmd = Commands.commands;
        await expect(new CommandParser.NumberArgument().parse("hello there")).to.eventually.be.rejectedWith(CommandParser.ArgumentError);
    })
})
