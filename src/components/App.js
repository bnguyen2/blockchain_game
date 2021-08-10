import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import './App.css';
import MemoryToken from '../abis/MemoryToken.json';
import brain from '../brain.png';
import { CARD_ARRAY } from '../data/cards';

const App = () => {
  const [account, setAccount] = useState('0x0');
  const [token, setToken] = useState(null);
  const [totalSupply, setTotalSupply] = useState(0);
  const [tokenURIs, setTokenURIs] = useState([]);
  const [cardArray] = useState(() =>
    CARD_ARRAY.sort(() => 0.5 - Math.random())
  );
  const [cardsChosen, setCardsChosen] = useState([]);
  const [cardsChosenId, setCardsChosenId] = useState([]);
  const [cardsWon, setCardsWon] = useState([]);

  useEffect(() => {
    const loadWeb3 = async () => {
      if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
      } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
      } else {
        window.alert(
          'Non-ethereum browser detected. You should consider trying MetaMask'
        );
      }
    };

    const loadBlockchainData = async () => {
      const web3 = window.web3;
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);

      const listOfTokensURIs = [];

      // Load smart contract
      const networkId = await web3.eth.net.getId();
      const networkData = MemoryToken.networks[networkId];

      if (networkData) {
        const abi = MemoryToken.abi;
        const address = networkData.address;
        const token = new web3.eth.Contract(abi, address);
        const totalSupply = await token.methods.totalSupply().call();
        setToken(token);
        setTotalSupply(totalSupply);

        // Load Tokens
        const balanceOf = await token.methods.balanceOf(accounts[0]).call();
        console.log('balanceOf: ', balanceOf);

        for (let i = 0; i < balanceOf; i++) {
          let id = await token.methods
            .tokenOfOwnerByIndex(accounts[0], i)
            .call();
          let tokenURI = await token.methods.tokenURI(id).call();
          listOfTokensURIs.push(tokenURI);
        }
        setTokenURIs(listOfTokensURIs);
      } else {
        window.alert('Smart contract not deployed to detected network.');
      }
    };

    loadWeb3();
    loadBlockchainData();
  }, []);

  const chooseImage = (cardId) => {
    cardId = cardId.toString();
    if (cardsWon.includes(cardId)) {
      return `${window.location.origin}/images/white.png`;
    } else if (cardsChosenId.includes(cardId)) {
      return CARD_ARRAY[cardId].img;
    } else {
      return `${window.location.origin}/images/blank.png`;
    }
  };

  const flipCard = async (cardId) => {
    setCardsChosen([...cardsChosen, cardArray[cardId].name]);
    setCardsChosenId([...cardsChosenId, cardId]);
  };

  const checkForMatch = async () => {
    const optionOneId = cardsChosenId[0];
    const optionTwoId = cardsChosenId[1];

    if (optionOneId === optionTwoId) {
      alert('You have clicked the same image!');
    } else if (cardsChosen[0] === cardsChosen[1]) {
      alert('You found a match');
      token.methods
        .mint(
          account,
          window.location.origin + CARD_ARRAY[optionOneId].img.toString()
        )
        .send({ from: account })
        .on('transactionHash', (hash) => {
          setCardsWon([...cardsWon, optionOneId, optionTwoId]);
          setTokenURIs([...tokenURIs, CARD_ARRAY[optionOneId].img]);
        });
    } else {
      alert('Sorry, try again');
    }

    setCardsChosen([]);
    setCardsChosenId([]);
  };

  useEffect(() => {
    if (cardsChosen.length === 2) {
      setTimeout(checkForMatch, 100);
    }
  }, [cardsChosen.length]);

  useEffect(() => {
    if (cardsWon.length === CARD_ARRAY.length) {
      alert('Congratulations! You found them all!');
    }
  }, [cardsWon.length === CARD_ARRAY.length]);

  return (
    <div>
      <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
        <a
          className="navbar-brand col-sm-3 col-md-2 mr-0"
          href="http://www.dappuniversity.com/bootcamp"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={brain}
            width="30"
            height="30"
            className="d-inline-block align-top"
            alt=""
          />
          &nbsp; Memory Tokens
        </a>
        <ul className="navbar-nav px-3">
          <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
            <small className="text-muted">
              <span id="account">{account}</span>
            </small>
          </li>
        </ul>
      </nav>
      <div className="container-fluid mt-5">
        <div className="row">
          <main role="main" className="col-lg-12 d-flex text-center">
            <div className="content mr-auto ml-auto">
              <h1 className="d-4">Start matching now!</h1>

              <div className="grid mb-4">
                {cardArray.map((card, key) => (
                  <img
                    key={key}
                    src={chooseImage(key)}
                    data-id={key}
                    onClick={(event) => {
                      let cardId = event.target.getAttribute('data-id');
                      if (!cardsWon.includes(cardId.toString())) {
                        flipCard(cardId);
                      }
                    }}
                  />
                ))}
              </div>

              <div>
                <h5>
                  Tokens Collected:
                  <span id="result">&nbsp;{tokenURIs.length}</span>
                </h5>

                <div className="grid mb-4">
                  {tokenURIs.map((tokenURI, key) => (
                    <img key={key} src={tokenURI} />
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
