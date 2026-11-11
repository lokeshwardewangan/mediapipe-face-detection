import ProctorCamera from "./components/ProctorCamera";

function App() {

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "30px 20px"
      }}
    >

      <h1>
        Quiz Proctor Test
      </h1>

      <p>
        Desktop + Mobile Camera AI Test
      </p>

      <ProctorCamera />

    </div>
  );
}

export default App;