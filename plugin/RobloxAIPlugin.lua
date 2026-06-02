local Plugin = plugin
local Toolbar = Plugin:CreateToolbar('RoarAI')
local Button = Toolbar:CreateButton('RoarAI', 'Open RoarAI web console and send selection data', '')

local DockWidgetInfo = DockWidgetPluginGuiInfo.new(
    Enum.InitialDockState.Float,
    true,
    true,
    320,
    360,
    220,
    140
)

local Widget = Plugin:CreateDockWidgetPluginGui('RoarAIConsole', DockWidgetInfo)
Widget.Title = 'RoarAI Studio AI'

local HttpService = game:GetService('HttpService')
local Selection = game:GetService('Selection')

local Frame = Instance.new('Frame')
Frame.Size = UDim2.fromScale(1, 1)
Frame.BackgroundTransparency = 1
Frame.Parent = Widget

local OpenButton = Instance.new('TextButton')
OpenButton.Size = UDim2.new(1, -24, 0, 42)
OpenButton.Position = UDim2.new(0, 12, 0, 12)
OpenButton.Text = 'Open RoarAI Console'
OpenButton.BackgroundColor3 = Color3.fromRGB(79, 140, 255)
OpenButton.TextColor3 = Color3.new(1, 1, 1)
OpenButton.Font = Enum.Font.GothamBold
OpenButton.TextSize = 16
OpenButton.Parent = Frame

local SendButton = Instance.new('TextButton')
SendButton.Size = UDim2.new(1, -24, 0, 42)
SendButton.Position = UDim2.new(0, 12, 0, 64)
SendButton.Text = 'Send Selection to AI'
SendButton.BackgroundColor3 = Color3.fromRGB(25, 197, 235)
SendButton.TextColor3 = Color3.new(0, 0, 0)
SendButton.Font = Enum.Font.GothamBold
SendButton.TextSize = 16
SendButton.Parent = Frame

local Status = Instance.new('TextLabel')
Status.Size = UDim2.new(1, -24, 0, 78)
Status.Position = UDim2.new(0, 12, 0, 120)
Status.BackgroundTransparency = 0.7
Status.BackgroundColor3 = Color3.fromRGB(10, 18, 28)
Status.BorderSizePixel = 0
Status.TextColor3 = Color3.fromRGB(221, 230, 238)
Status.Font = Enum.Font.Gotham
Status.TextSize = 14
Status.TextWrapped = true
Status.Text = 'RoarAI plugin initialized. Start your local bridge server and enable HTTP requests in Studio settings.'
Status.Parent = Frame

local function setStatus(text)
    Status.Text = text
end

local function openConsole()
    local url = 'http://127.0.0.1:3000'
    Plugin:OpenBrowserWindow(url)
    setStatus('Opened local RoarAI console in your browser.')
end

local function sendSelectionToAI()
    if not game:GetService('HttpService').HttpEnabled then
        setStatus('HTTP requests are disabled in Studio. Enable them in Studio settings before using the plugin.')
        return
    end

    local selection = Selection:Get()
    if #selection == 0 then
        setStatus('Select one or more instances in Explorer before sending to AI.')
        return
    end

    local items = {}
    for _, instance in ipairs(selection) do
        table.insert(items, string.format('- %s (%s)', instance:GetFullName(), instance.ClassName))
    end

    local payload = HttpService:JSONEncode({
        model = 'llama2',
        source = 'roblox',
        prompt = 'Selected Roblox objects:\n' .. table.concat(items, '\n') .. '\n\nExplain best practices and suggest improvements for these objects in a Roblox game project.',
    })

    local url = 'http://127.0.0.1:3000/api/roblox'
    local success, response = pcall(function()
        return HttpService:PostAsync(url, payload, Enum.HttpContentType.ApplicationJson)
    end)

    if success then
        local result = HttpService:JSONDecode(response)
        setStatus('AI response received:\n' .. result.response)
    else
        setStatus('Unable to contact the local RoarAI bridge. Start the server at http://127.0.0.1:3000.')
    end
end

Button.Click:Connect(function()
    Widget.Enabled = not Widget.Enabled
end)

OpenButton.MouseButton1Click:Connect(openConsole)
SendButton.MouseButton1Click:Connect(sendSelectionToAI)

setStatus('RoarAI plugin is ready. Click "Open RoarAI Console" or send selection to AI.')
