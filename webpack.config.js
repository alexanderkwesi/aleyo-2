new webpack.DefinePlugin({
  "process.env.REACT_APP_API_URL": JSON.stringify(process.env.REACT_APP_API_URL || "https://aleyo-2-1.onrender.com"),
  // Or if you need the whole env object, merge it properly:
  "process.env": JSON.stringify({
    ...process.env,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL || "https://aleyo-2-1.onrender.com",
  }),
}),
