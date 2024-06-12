import { createFileRoute, defer } from '@tanstack/react-router'
import { getSponsorsForSponsorPack } from '~/server/sponsors'
import discordImage from '~/images/discord-logo-white.svg'
import { useMutation } from '~/hooks/useMutation'
import { sample } from '~/utils/utils'

export const textColors = [
  `text-rose-500`,
  `text-yellow-500`,
  `text-teal-500`,
  `text-blue-500`,
]

export const gradients = [
  `from-rose-500 to-yellow-500`,
  `from-yellow-500 to-teal-500`,
  `from-teal-500 to-violet-500`,
  `from-blue-500 to-pink-500`,
]

const _courses = [
  {
    name: 'The Official TanStack React Query Course',
    cardStyles: `border-t-4 border-red-500 hover:(border-green-500)`,
    href: 'https://query.gg/?s=tanstack',
    description: `Learn how to build enterprise quality apps with TanStack's React Query the easy way with our brand new course.`,
  },
]

export const Route = createFileRoute('/')({
  loader: () => {
    return {
      randomNumber: Math.random(),
      sponsorsPromise: defer(getSponsorsForSponsorPack()),
    }
  },
  component: Index,
})

async function bytesSignupServerFn({ email }: { email: string }) {
  'use server'

  return fetch(`https://bytes.dev/api/bytes-optin-cors`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      influencer: 'tanstack',
    }),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  })
}

function Index() {
  const _bytesSignupMutation = useMutation({
    fn: bytesSignupServerFn,
  })

  const { _sponsorsPromise, randomNumber, _testing2 } = Route.useLoaderData()
  const gradient = sample(gradients, randomNumber)
  const textColor = sample(textColors, randomNumber)

  return (
    <>
      {discordImage}
      {gradient}
      {textColor}
    </>
  )
}
