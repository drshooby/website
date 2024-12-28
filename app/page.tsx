import NameHeader from "../components/nameheader/NameHeader";
import Background from "../components/background/Background";
import Navbar from "../components/navbar/Navbar";
import Glass from "../components/glass/Glass";

export default function Home() {
    return (
        <Background>
            <Glass>
                <NameHeader />
                <Navbar />
            </Glass>
        </Background>
    )
}
