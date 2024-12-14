import createMDX from '@next/mdx'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
}
 
const withMDX = createMDX({
  // ここにmdxの設定を書く
})
 
export default withMDX(nextConfig)