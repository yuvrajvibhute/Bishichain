## Foundry

**Foundry is a blazing fast, portable and modular toolkit for developing EVM-compatible applications, written in Rust.**

Foundry consists of:

- **Forge**: EVM testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local EVM node, akin to Ganache or Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```


---

## 📜 MST Testnet Deployment

- **Deployment Tx:** [`0x2d45bc2108cf9bd318e282da8d89ece4f4d869e24d015b9a61a15bcf79679e58`](https://testnet.mstscan.com/tx/0x2d45bc2108cf9bd318e282da8d89ece4f4d869e24d015b9a61a15bcf79679e58)
- **CircleFactory:** [`0xf8a27c259a8912f17468b0bb15de371a25d9caab`](https://testnet.mstscan.com/address/0xf8a27c259a8912f17468b0bb15de371a25d9caab)
- **TrustSBT:** [`0x62756310a85a87ea9e8b3abfc10fc4dbccc5c35a`](https://testnet.mstscan.com/address/0x62756310a85a87ea9e8b3abfc10fc4dbccc5c35a)
