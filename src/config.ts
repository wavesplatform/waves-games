export interface Config {
  nodeUri: string
  matcherUri: string
  matcherPublicKey: string
  chainId: string
  btcId: string
  ethId: string
}

export const config = {
  wavesId: 'WAVES',
  mainnet: {
    chainId: 'W',
    nodeUri: 'https://nodes.wavesnodes.com',
    matcherUri: 'https://matcher.wavesplatform.com/matcher',
    matcher: '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
    btcId: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
    ethId: '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu',
    marketDapp: '',
  },
  testnet: {
    chainId: 'T',
    nodeUri: 'https://testnodes.wavesnodes.com',
    matcherUri: 'https://matcher.testnet.wavesnodes.com/matcher',
    matcher: '8QUAqtTckM5B8gvcuP7mMswat9SjKUuafJMusEoSn1Gy',
    btcId: 'DWgwcZTMhSvnyYCoWLRUXXSH1RSkzThXLJhww9gwkqdn',
    ethId: 'BrmjyAWT5jjr3Wpsiyivyvg5vDuzoX2s93WgiexXetB3',
    marketDapp: '',
  },
}
