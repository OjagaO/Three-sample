import "./App.css"
import Gui from "./components/Gui";
import Viewer from './components/Viewer';

const App = () => {
  return (
    <div className="App">
      <Gui />
      <Viewer />
    </div>
  )
}

export default App