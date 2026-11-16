import Foundation
import LinewiseEngine
// stdin: JSON {name: sheetText}. stdout: JSON {name: {lines: [{t, r, s, f?}], total}}.
// s = syntax spans [start, length, kind] relative to the line; f = [[typedChars, result]] where the answer changes while typing (names starting "hero").
let rates: [String: Double] = ["USD": 1, "EUR": 0.9073, "GBP": 0.7712, "JPY": 159.79, "INR": 96.2, "CAD": 1.402, "AUD": 1.54, "CHF": 0.80, "BTC": 1.5343e-5, "ETH": 5.459e-4]
let calc = Calculator(rates: rates)
let input = try! JSONSerialization.jsonObject(with: FileHandle.standardInput.readDataToEndOfFile()) as! [String: String]
var out: [String: Any] = [:]
for (name, text) in input {
    let r = calc.evaluate(text)
    let lines = text.components(separatedBy: "\n")
    var starts: [Int] = [], pos = 0
    for l in lines { starts.append(pos); pos += (l as NSString).length + 1 }
    var rows: [[String: Any]] = []
    for (i, line) in lines.enumerated() {
        let n = (line as NSString).length
        let spans = r.spans.filter { $0.location >= starts[i] && $0.location < starts[i] + max(n, 1) }
            .map { [$0.location - starts[i], $0.length, "\($0.kind)"] as [Any] }
        var row: [String: Any] = ["t": line, "r": r.lines[i], "s": spans]
        if name.hasPrefix("hero") {
            let before = lines[..<i].joined(separator: "\n") + (i > 0 ? "\n" : "")
            var frames: [[Any]] = [], last = ""
            for k in 0...n {
                let res = calc.evaluate(before + (line as NSString).substring(to: k)).lines[i]
                if res != last { frames.append([k, res]); last = res }
            }
            row["f"] = frames
        }
        rows.append(row)
    }
    out[name] = ["lines": rows, "total": r.total ?? ""]
}
print(String(data: try! JSONSerialization.data(withJSONObject: out, options: [.sortedKeys]), encoding: .utf8)!)
