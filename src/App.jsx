import { Box } from "@radix-ui/themes";
import CreateProposalModal from "./components/CreateProposalModal";
import Proposals from "./components/Proposals";
import { useProposals } from "./context/proposalsContext";

function App() {
    const { proposals } = useProposals();
    return (
        <Layout>
            <Box className="flex justify-end p-4">
                <CreateProposalModal />
            </Box>

            <Proposals proposals={proposals} />
        </Layout>
    );
}

export default App;
