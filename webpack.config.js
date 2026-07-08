new webpack.DefinePlugin({
  'process.env.REACT_APP_API_URL': JSON.stringify(
    process.env.REACT_APP_API_URL || 'https://aleyo-2-1.onrender.com'
  ),
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  'process.env.PUBLIC_URL': JSON.stringify(process.env.PUBLIC_URL || ''),
}),
