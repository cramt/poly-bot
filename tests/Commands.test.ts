import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import * as Commands from '../src/commands';
import * as CommandParser from '../src/Command';

var cmd = Commands.commands;
chai.use(chaiAsPromised)
const assert = chai.assert
console.log("Process: " + process.pid)

describe('Number Arguments', () => {
    it('Invalid number', () => {
        assert.isRejected(new CommandParser.NumberArgument().parse("hello there"), CommandParser.ArgumentError)
    })
    it('Valid number', () => {
        assert.eventually.equal(new CommandParser.NumberArgument().parse("4"), 4)
    })
})

after( () => {
    process.exit(0)
})