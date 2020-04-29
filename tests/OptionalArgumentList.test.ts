import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import * as Commands from '../src/commands';
import {AnyArgument, NumberArgument, OptionalArgumentList, SpecificArgument} from "../src/Command";

let cmd = Commands.commands;
chai.use(chaiAsPromised);
const assert = chai.assert;

describe("OptionalArgumentList", () => {
    const discordData = {
        author: null as any,
        channel: null as any,
        guild: null as any
    };


    it("can work with only required", () => {
        let list = new OptionalArgumentList([
            {
                argument: new NumberArgument(),
                type: "required"
            },
            {
                argument: new SpecificArgument("hello there"),
                type: "required"
            },
            {
                argument: new AnyArgument(),
                type: "required"
            }, {
                argument: new NumberArgument(),
                type: "required"
            }
        ])
        assert.eventually.deepEqual(list.parse(["2", "hello there", "a", "5"], discordData).then(y => y.map(x => x.value)),  [2, "hello there", "a", 5])
    })

    it("can work with only optional", () => {
        let list = new OptionalArgumentList([
            {
                argument: new NumberArgument(),
                type: "default",
                default: 7
            },
            {
                argument: new AnyArgument(),
                type: "default",
                default: "hello"
            },
            {
                argument: new NumberArgument(),
                type: "default",
                default: 7.3
            }
        ])
        assert.eventually.deepEqual(list.parse([], discordData).then(y => y.map(x => x.value)), [7, "hello", 7.3])

        assert.eventually.deepEqual(list.parse(["10", "aaa", "4"], discordData).then(y => y.map(x => x.value)), [10, "aaa", 4])

        assert.eventually.deepEqual(list.parse(["10"], discordData).then(y => y.map(x => x.value)), [10, "hello", 7.3])
    })

    it("can work with required, optional, required", () => {
        let list = new OptionalArgumentList([
            {
                argument: new NumberArgument(),
                type: "required",
            },
            {
                argument: new AnyArgument(),
                type: "default",
                default: "hello"
            },
            {
                argument: new NumberArgument(),
                type: "required",
            }
        ])
        assert.eventually.deepEqual(list.parse(["2", "5"], discordData).then(y => y.map(x => x.value)), [2, "hello", 5]);

        assert.eventually.deepEqual(list.parse(["2", "aaaa", "5"], discordData).then(y => y.map(x => x.value)), [2, "aaaa", 5]);
    })
});