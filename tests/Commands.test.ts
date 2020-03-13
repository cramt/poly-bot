import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import * as Commands from '../src/commands';
import * as CommandParser from '../src/Command';

var cmd = Commands.commands;
chai.use(chaiAsPromised)
const assert = chai.assert

describe('Number Arguments', () => {
    it('Invalid number', () => {
        assert.isRejected(new CommandParser.NumberArgument().parse({
            content: "hello there",
            channel: null as any,
            guild: null as any,
            author: null as any
        }).then(x => x.value), CommandParser.ArgumentError)
    })
    it('Valid number', () => {
        assert.eventually.equal(new CommandParser.NumberArgument().parse({
            content: "4",
            channel: null as any,
            guild: null as any,
            author: null as any
        }).then(x => x.value), 4)
    })
})

after(() => {
    process.exit(0)
})
