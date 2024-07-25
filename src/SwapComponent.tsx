import { useEffect, useState, createContext, useContext } from "react";
import { useMetaMaskStore, useGarden, useSignStore } from "./store";
import { Assets } from "@gardenfi/orderbook";

type AmountState = {
  btcAmount: string | null;
  wbtcAmount: string | null;
};

// creating context for prop drilling purposes, I hate typescript
type PairContextType = {
  pair: "BTC-WBTC" | "WBTC-BTC";
  setPair: React.Dispatch<React.SetStateAction<"BTC-WBTC" | "WBTC-BTC">>;
};

const PairContext = createContext<PairContextType | undefined>(undefined);
// worked inside the swap component scope, if error put it back in there


const SwapComponent: React.FC = () => {

  const [amount, setAmount] = useState<AmountState>({
    btcAmount: null,
    wbtcAmount: null,
  });

  const [pair, setPair] = useState<"BTC-WBTC" | "WBTC-BTC">("WBTC-BTC");

  const changeAmount = (pair: "WBTC-BTC" | "BTC-WBTC", value: string) => {
    if (pair === "WBTC-BTC") {
      handleWBTCChange(value);
      setPair("WBTC-BTC");
    } else {
      handleBTCChange(value);
      setPair("BTC-WBTC");
    }
  };

  // The part of code that handles the WBTC-BTC swap
  const handleWBTCChange = (value: string) => {
    const newAmount: AmountState = { wbtcAmount: value, btcAmount: null };
    if (Number(value) > 0) {
      const btcAmount = (1 - 0.3 / 100) * Number(value);
      newAmount.btcAmount = btcAmount.toFixed(8).toString();
    }
    setAmount(newAmount);
  };

  // The part of code that handles the BTC-WBTC swap
  const handleBTCChange = (value: string) => {
    const newAmount: AmountState = { btcAmount: value, wbtcAmount: null };
    if (Number(value) > 0) {
      const wbtcAmount = (1 - 0.3 / 100) * Number(value);
      newAmount.wbtcAmount = wbtcAmount.toFixed(8).toString();
    }
    setAmount(newAmount);
  };

  return (
    <PairContext.Provider value={{ pair, setPair }}>
      <div className="swap-component">
        <WalletConnect />
        <hr />
        <div className="radio-buttons">
          <div>
            <label>
              <input
                type="radio"
                name="pair"
                value="BTC-WBTC"
                checked={pair === "BTC-WBTC"}
                onChange={() => setPair("BTC-WBTC")}
              />
              BTC-WBTC
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="pair"
                value="WBTC-BTC"
                checked={pair === "WBTC-BTC"}
                onChange={() => setPair("WBTC-BTC")}
              />
              WBTC-BTC
            </label>
          </div>
        </div>
        <hr />
        <SwapAmount amount={amount} changeAmount={changeAmount} pair={pair} />
        <hr />
        <Swap amount={amount} changeAmount={changeAmount} pair={pair} />
      </div>
    </PairContext.Provider>
  );
};

const WalletConnect: React.FC = () => {
  const { connectMetaMask, metaMaskIsConnected } = useMetaMaskStore();

  return (
    <div className="swap-component-top-section">
      <span className="swap-title">Swap</span>
      <MetaMaskButton
        isConnected={metaMaskIsConnected}
        onClick={connectMetaMask}
      />
    </div>
  );
};

type MetaMaskButtonProps = {
  isConnected: boolean;
  onClick: () => void;
};

const MetaMaskButton: React.FC<MetaMaskButtonProps> = ({
  isConnected,
  onClick,
}) => {
  const buttonClass = `connect-metamask button-${isConnected ? "black" : "white"
    }`;
  const buttonText = isConnected ? "Connected" : "Connect Metamask";

  return (
    <button className={buttonClass} onClick={onClick}>
      {buttonText}
    </button>
  );
};

type TransactionAmountComponentProps = {
  amount: AmountState;
  changeAmount: (pair: "WBTC-BTC" | "BTC-WBTC", value: string) => void;
  pair: "BTC-WBTC" | "WBTC-BTC";
};

const SwapAmount: React.FC<TransactionAmountComponentProps> = ({
  amount,
  changeAmount,
}) => {
  const { wbtcAmount, btcAmount } = amount;

  // Use the context here
  const pairContext = useContext(PairContext);
  if (!pairContext) {
    throw new Error("SwapAmount must be used within a PairContext.Provider");
  }
  const { pair } = pairContext;

  return (
    <div className="swap-component-middle-section">
      {pair === "WBTC-BTC" ? (
        <>
          <InputField
            id="wbtc"
            label="Send WBTC"
            value={wbtcAmount}
            onChange={(value) => changeAmount("WBTC-BTC", value)}
          />

          <InputField
            id="btc"
            label="Receive BTC"
            value={btcAmount}
            readOnly
          />
        </>
      ) : (
        <>
          <InputField
            id="btc"
            label="Send BTC"
            value={btcAmount}
            onChange={(value) => changeAmount("BTC-WBTC", value)}
          />

          <InputField
            id="wbtc"
            label="Receive WBTC"
            value={wbtcAmount}
            readOnly
          />
        </>
      )}
    </div>
  );
};

type InputFieldProps = {
  id: string;
  label: string;
  value: string | null;
  readOnly?: boolean;
  onChange?: (value: string) => void;
};

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  readOnly,
  onChange,
}) => (
  <div>
    <label htmlFor={id}>{label}</label>
    <div className="input-component">
      <input
        id={id}
        placeholder="0"
        value={value ? value : ""}
        type="number"
        readOnly={readOnly}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
      <button>{id.toUpperCase()}</button>
    </div>
  </div>
);

type SwapAndAddressComponentProps = {
  amount: AmountState;
  changeAmount: (pair: "WBTC-BTC" | "BTC-WBTC", value: string) => void;
  pair: "BTC-WBTC" | "WBTC-BTC";
};

const Swap: React.FC<SwapAndAddressComponentProps> = ({
  amount,
  changeAmount,
}) => {
  const { garden, bitcoin } = useGarden();
  const [btcAddress, setBtcAddress] = useState<string>();
  const { metaMaskIsConnected } = useMetaMaskStore();
  const { wbtcAmount, btcAmount } = amount;
  const { isSigned } = useSignStore();

  // Use the context here
  const pairContext = useContext(PairContext);
  console.log("PairContext:", pairContext);
  if (!pairContext) {
    throw new Error("Swap must be used within a PairContext.Provider");
  }
  const { pair, setPair } = pairContext;

  useEffect(() => {
    if (!bitcoin) return;
    const getAddress = async () => {
      if (isSigned) {
        const address = await bitcoin.getAddress();
        setBtcAddress(address);
      }
    };
    getAddress();
  }, [bitcoin, isSigned]);

  const handleSwap = async () => {
    if (
      !garden ||
      typeof Number(wbtcAmount) !== "number" ||
      typeof Number(btcAmount) !== "number"
    )
      return;

    // check if this works properly!!!!!!!!!!!!!!!!!
    const sendAmount = pair === "WBTC-BTC" ? Number(wbtcAmount) * 1e8 : Number(btcAmount) * 1e8;
    const recieveAmount = pair === "WBTC-BTC" ? Number(btcAmount) * 1e8 : Number(wbtcAmount) * 1e8;

    changeAmount("WBTC-BTC", "");

    await garden.swap(
      pair === "WBTC-BTC" ? Assets.ethereum_localnet.WBTC : Assets.bitcoin_regtest.BTC,
      pair === "WBTC-BTC" ? Assets.bitcoin_regtest.BTC : Assets.ethereum_localnet.WBTC,
      sendAmount,
      recieveAmount
    );
  };

  return (
    <div className="swap-component-bottom-section">
      <div>
        {pair === "WBTC-BTC" ? <label htmlFor="receive-address">Receive address</label> : <label htmlFor="receive-address">bitcoinOTA sender address</label>}
        <div className="input-component">
          <input
            id="receive-address"
            placeholder="Enter BTC Address"
            value={btcAddress ? btcAddress : ""}
            onChange={(e) => setBtcAddress(e.target.value)}
          />
        </div>
      </div>
      <div>Please faucet some WBTC and swap it to the BTC OTA first before swapping BTC to WBTC</div>
      <button
        className={`button-${metaMaskIsConnected ? "white" : "black"}`}
        onClick={handleSwap}
        disabled={!metaMaskIsConnected}
      >
        Swap
      </button>
    </div>
  );
};

export default SwapComponent;
