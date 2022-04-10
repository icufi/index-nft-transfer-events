import { ipfs, json } from '@graphprotocol/graph-ts';
import {
  Transfer as TransferEvent,
  Token as TokenContract,
} from '../generated/Token/Token';
import { Token, User } from '../generated/schema';

const ipfshash = 'QmWEFSMku6yGLQ9TQr66HjSd9kay8ZDYKbBEfjNi4pLtrr';

export function handleTransfer(event: TransferEvent): void {
  /* load the token from the existing Graph Node */
  let token = Token.load(event.params.tokenId.toString());
  if (!token) {
    /* if the token does not yet exist, create it */
    token = new Token(event.params.tokenId.toString());
    token.tokenID = event.params.tokenId;

    token.tokenURI = '/' + event.params.tokenId.toString();

    /* combine the ipfs hash and the token ID to fetch the token metadata from IPFS */
    let metadata = ipfs.cat(ipfshash + token.tokenURI);
    if (metadata) {
      const value = json.fromBytes(metadata).toObject();
      if (value) {
        /* using the metatadata from IPFS, update the token object with the values  */
        const image = value.get('image');
        const name = value.get('name');
        const description = value.get('description');
        const externalURL = value.get('external_url');

        if (name && image && description && externalURL) {
          token.name = name.toString();
          token.image = image.toString();
          token.externalURL = externalURL.toString();
          token.description = description.toString();
          token.ipfsURI = 'infura-ipfs.io/ipfs/' + ipfshash + token.tokenURI;
        }
      }
    }
  }
  token.updatedAtTimestamp = event.block.timestamp;

  /* set or update the owner field and save the token to the Graph Node */
  token.owner = event.params.to.toHexString();
  token.save();

  /* if the user does not yet exist, create them */
  let user = User.load(event.params.to.toHexString());
  if (!user) {
    user = new User(event.params.to.toHexString());
    user.save();
  }
}
