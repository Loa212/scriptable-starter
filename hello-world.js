// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: calendar-alt;

const widget = new ListWidget()
widget.setPadding(14, 16, 14, 16)

const text = widget.addText("Hello World")
text.font = Font.boldSystemFont(18)
text.textColor = Color.dynamic(new Color("#0b132b"), Color.white())

if (config.runsInWidget) {
  Script.setWidget(widget)
} else {
  await widget.presentSmall()
}
Script.complete()
