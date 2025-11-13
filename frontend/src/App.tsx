import { Layout } from './components/Layout'
import { Card } from './components/Card'
import { Chat } from './components/Chat'

function App() {
  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full py-4 sm:py-6">
        <Card className="h-full p-0 overflow-hidden flex flex-col">
          <Chat />
        </Card>
      </div>
    </Layout>
  )
}

export default App

