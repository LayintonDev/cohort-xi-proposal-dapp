import { Box } from "@radix-ui/themes";
import CreateProposalModal from "./components/CreateProposalModal";
import Layout from "./components/Layout";

function App() {

    return (
        <Layout>
            <Box className="flex justify-end p-4">
                <CreateProposalModal />
            </Box>
        </Layout>
    );
}

export default App;
