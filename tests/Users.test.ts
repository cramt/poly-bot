import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import * as Commands from '../src/commands';
import { User, DiscordUser } from '../src/User';

var cmd = Commands.commands;
chai.use(chaiAsPromised)
const assert = chai.assert

describe('Users', () => {
    it('can create new user', () => {
        let user = new DiscordUser("Lucca", "FEMME", null, null, "<@55437543543>")
        assert.isNotNull(user)
    })
})

after(() => {
    
})