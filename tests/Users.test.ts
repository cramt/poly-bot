import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import * as Commands from '../src/commands';
import { User } from '../src/User';

var cmd = Commands.commands;
chai.use(chaiAsPromised)
const assert = chai.assert

describe('Users', () => {
    it('constructor', () => {
        let user = new User("Lucca", "FEMME", null, "<@55437543543>", null, null)
        assert.isNotNull(user)
    })
})

after(() => {
    process.exit(0)
})