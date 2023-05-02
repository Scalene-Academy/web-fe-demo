import { useState } from "react";
import Head from "next/head";
import { BigNumber, ethers } from "ethers";
import type { NextPage } from "next";
import { useProvider, useSigner } from "wagmi";
import { hardhat } from "wagmi/chains";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import { InputBase } from "~~/components/scaffold-eth";
import contracts from "~~/generated/deployedContracts";

type EventType = {
  contributor: string;
  campaignId: BigNumber;
  amount: BigNumber;
};

const ContractABIs = contracts[hardhat.id][0]["contracts"];

const Playground: NextPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();
  const [campaignId, setCampaignId] = useState("");

  const [transactions, setTransactions] = useState<EventType[]>([]);

  const { data: signer } = useSigner();
  const provider = useProvider();

  const convertor = () => {
    const oneGwei = BigNumber.from("1000000000");
    const oneEther = BigNumber.from("1000000000000000000");

    console.log("gwei 1", ethers.utils.formatUnits(oneGwei, 0));
    // '1000000000'

    console.log("gwei 2", ethers.utils.formatUnits(oneGwei, "gwei"));
    // '1.0'

    console.log("gwei 2", ethers.utils.formatUnits(oneGwei, 9));
    // '1.0'

    console.log("ether 1", ethers.utils.formatUnits(oneEther));
    // default is ether
    // '1.0'

    console.log("ether 2", ethers.utils.formatUnits(oneEther, 18));
    // '1.0'
  };

  const handleContribute = async () => {
    if (signer) {
      setIsLoading(true);
      // signer for mutations and provider for read only (gas-less)
      const fundraiseContract = new ethers.Contract(
        ContractABIs["Fundraise"].address,
        ContractABIs["Fundraise"].abi,
        signer,
      );

      try {
        const tx = await fundraiseContract.contribute(campaignId);

        const receipt = await tx.wait();

        console.log("receipt", receipt);

        // provider.once(tx.hash, transaction => {
        //   console.log(transaction);
        //   // Emitted when the transaction has been mined
        // });

        // provider.on("pending", tx => {
        //   console.log("pending state", tx);
        //   // Emitted when any new pending transaction is noticed
        // });

        // provider.on("error", tx => {
        //   console.log("error on tx", tx);
        //   // Emitted when any error occurs
        // });

        setIsLoading(false);
      } catch (error: any) {
        console.error("An error occurred:", error);
        setError(error.reason);
        setIsLoading(false);
      }
    } else {
      console.error("No signer");
    }
  };

  const fetchContributions = async () => {
    const fundraiseContract = new ethers.Contract(
      ContractABIs["Fundraise"].address,
      ContractABIs["Fundraise"].abi,
      provider,
    );

    // You can add a filter to the event
    const contributionsMadeFilter = fundraiseContract.filters.ContributionMade(null);

    const contributionEvents = await fundraiseContract.queryFilter(contributionsMadeFilter);

    contributionEvents.forEach((event: any) => {
      if (event) {
        // console.log(event.args);
        setTransactions(prevState => [...prevState, event.args]);
      }
    });
  };

  return (
    <>
      <Head>
        <title>Frontend Playground</title>
        <meta name="description" content="Created with 🏗 scaffold-eth-2" />
        {/* We are importing the font this way to lighten the size of SE2. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree&display=swap" rel="stylesheet" />
      </Head>
      <div className="grid flex-grow" data-theme="playground">
        <section className="p-3 sm:p-5">
          {/* Mutation Buttons */}
          <div className="flex flex-row gap-4 py-4">
            <div className="">
              <button
                className={`btn btn-primary rounded-full capitalize font-normal font-white w-50 flex items-center gap-1 hover:gap-2 transition-all tracking-widest ${
                  isLoading ? "loading" : ""
                }`}
                onClick={handleContribute}
              >
                {!isLoading && (
                  <>
                    Contribute <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                  </>
                )}
              </button>
              <div className="py-4">
                <InputBase value={campaignId} onChange={id => setCampaignId(id)} placeholder="Campaign ID" />
              </div>
            </div>

            <button
              className={`btn btn-primary rounded-full capitalize font-normal font-white w-50 flex items-center gap-1 hover:gap-2 transition-all tracking-widest`}
              onClick={fetchContributions}
            >
              Fetch Events
            </button>

            <button
              className={`btn btn-primary rounded-full capitalize font-normal font-white w-50 flex items-center gap-1 hover:gap-2 transition-all tracking-widest`}
              onClick={convertor}
            >
              Show Conversions
            </button>
          </div>
          <div>{error && <p className="text-red-500">Error: {error}</p>}</div>
        </section>

        {/* Table of transactions */}
        <section className="p-3 sm:p-5">
          <div className="mx-auto max-w-screen-xl px-4 lg:px-12">
            <div className="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Contributor
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Campaign Id
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Amount ($SCAL)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, index) => {
                      return (
                        <tr key={index} className="border-b dark:border-gray-700">
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                            {transaction.contributor}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                            {/* Showing how we can convert it straight to a string from BigNumber */}
                            {transaction.campaignId.toString()}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                            {/* We can also convert it straight from a BigNumber to a string with the correct decimals */}
                            {ethers.utils.formatEther(transaction.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Playground;
