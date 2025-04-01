# Idea
Implement a platform containing one-click trading strategies across multiple chains

# TODO
- [chains](./src/services/general/chains) should only send txn
- txns object should be created and send from inside each service like [this file](./src/services/general/services/dca/create-txn), for eg - swap txn
- token support should go to [constants](./src/constants)
- [dca service](/src/services/general/services/dca) should be taking in token and chain as param
- update .env.example
