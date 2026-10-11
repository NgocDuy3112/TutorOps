import { useParams } from 'react-router-dom'

function StudentDetailPage() {
  const { id } = useParams()

  return (
    <div>
      <h1>Student {id}</h1>
      <p>Student details coming soon.</p>
    </div>
  )
}

export default StudentDetailPage
