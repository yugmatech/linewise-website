// swift-tools-version: 6.0
import PackageDescription
let package = Package(name: "eval", platforms: [.macOS(.v15)],
  dependencies: [.package(path: "../../../Linewise")],
  targets: [.executableTarget(name: "eval", dependencies: [.product(name: "LinewiseEngine", package: "Linewise")])])
