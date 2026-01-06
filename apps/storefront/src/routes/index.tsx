import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { productsQueryOptions, collectionProductsQueryOptions } from '~/utils/product'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { data: collectionProducts } = useSuspenseQuery(collectionProductsQueryOptions('08cf8a71-0844-4fc0-ade2-8850a303bbb7'))
  return (
    <div className="p-2">
      <h3 className='text-2xl'>Welcome Home!!!</h3>
      <p>We have {collectionProducts.products.length} products available.</p>
      {collectionProducts.products.map((product) => (
        <Link to="/products/$slug" params={{ slug: product.slug }} key={product.id} className="border p-2 my-2">
          <h4 className="font-bold">{product.name}</h4>
          <p>{product.description}</p>
     
        </Link>
      ))}
    </div>
  )
}
