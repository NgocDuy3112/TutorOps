import { useParams } from 'react-router-dom'

function TutorDetailPage() {
  const { id } = useParams()

  return (
    <div>
      <h1>Tutor {id}</h1>
      <p>Tutor details coming soon.</p>
    </div>
  )
}

export default TutorDetailPage
