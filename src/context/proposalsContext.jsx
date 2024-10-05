import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import useContract from "../hooks/useContract";
import useRunners from "../hooks/useRunners";
import { Contract } from "ethers";
import { Interface } from "ethers";
import ABI from "../ABI/proposal.json";

const multicallAbi = [
    "function tryAggregate(bool requireSuccess, (address target, bytes callData)[] calls) returns ((bool success, bytes returnData)[] returnData)",
];

const ProposalsContext = createContext({
    proposals: [],
});

export const ProposalsContextProvider = ({ children }) => {
    const [proposals, setProposals] = useState([]);
    const readOnlyProposalContract = useContract(true);
    const { readOnlyProvider } = useRunners();

    const fetchProposals = useCallback(async () => {
        if (!readOnlyProposalContract) return;

        const multicallContract = new Contract(
            import.meta.env.VITE_MULTICALL_ADDRESS,
            multicallAbi,
            readOnlyProvider
        );

        const itf = new Interface(ABI);

        try {
            const proposalCount = Number(
                await readOnlyProposalContract.proposalCount()
            );

            const proposalsIds = Array.from(
                { length: proposalCount - 1 },
                (_, i) => i + 1
            );

            const calls = proposalsIds.map((id) => ({
                target: import.meta.env.VITE_CONTRACT_ADDRESS,
                callData: itf.encodeFunctionData("proposals", [id]),
            }));

            const responses = await multicallContract.tryAggregate.staticCall(
                true,
                calls
            );

            const decodedResults = responses.map((res) =>
                itf.decodeFunctionResult("proposals", res.returnData)
            );

            const data = decodedResults.map((proposalStruct, index) => ({
                id: proposalsIds[index],
                description: proposalStruct.description,
                amount: proposalStruct.amount,
                minRequiredVote: proposalStruct.minVotesToPass,
                voteCount: Number(proposalStruct.voteCount),
                deadline: proposalStruct.votingDeadline,
                executed: proposalStruct.executed,
            }));

            setProposals(data);
        } catch (error) {
            console.log("error fetching proposals: ", error);
        }
    }, [readOnlyProposalContract, readOnlyProvider]);

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);

    const proposalCreatedHandler = useCallback(
        (
            proposalId,
            description,
            _,
            amount,
            votingDeadline,
            minVotesToPass
        ) => {
            setProposals((prev) => [
                ...prev,
                {
                    id: Number(proposalId),
                    description: description,
                    amount: amount,
                    minRequiredVote: minVotesToPass,
                    voteCount: 0,
                    deadline: votingDeadline,
                    executed: false,
                },
            ]);
        },
        []
    );

    const votedHandler = useCallback((proposalId) => {
        console.log("voted: ", proposalId, " ", Math.random());

        setProposals((prev) =>
            prev.map((p) => {
                console.log("p: ", p);
                return p.id === Number(proposalId)
                    ? { ...p, voteCount: p.voteCount + 1 }
                    : p;
            })
        );
    }, []);

    useEffect(() => {
        // // const filter = readOnlyProposalContract.filter.ProposalCreated()
        const contract = new Contract(
            import.meta.env.VITE_CONTRACT_ADDRESS,
            ABI,
            readOnlyProvider
        );
        contract.on("ProposalCreated", proposalCreatedHandler);
        console.log("created listener added");
        return () => {
            contract.off("ProposalCreated", proposalCreatedHandler);
            console.log("created listener removed");
        };
    }, [proposalCreatedHandler, readOnlyProvider]);

    useEffect(() => {
        const contract = new Contract(
            import.meta.env.VITE_CONTRACT_ADDRESS,
            ABI,
            readOnlyProvider
        );
        contract.on("Voted", votedHandler);
        console.log("listener added");

        return () => {
            contract.off("Voted", votedHandler);
            console.log("listener removed");
        };
    }, [readOnlyProvider, votedHandler]);

    return (
        <ProposalsContext.Provider
            value={{
                proposals,
            }}
        >
            {children}
        </ProposalsContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useProposals = () => {
    const context = useContext(ProposalsContext);
    if (!context)
        return console.error(
            "useProposals should be used within PropsalsContextProvider"
        );
    return context;
};
