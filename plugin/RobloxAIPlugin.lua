--[[
    ROAR AI - Roblox Studio Plugin v1.0.0
    Production-ready plugin for analyzing Roblox code with local AI
    
    Features:
    - Open ROAR AI web console
    - Send code to AI for analysis
    - Get performance and security suggestions
    - No API keys required - fully local
]]

local Plugin = plugin
local HttpService = game:GetService('HttpService')
local Selection = game:GetService('Selection')

-- Configuration
local BRIDGE_URL = 'http://127.0.0.1:3000'
local PLUGIN_VERSION = '1.0.0'

-- Create toolbar and buttons
local Toolbar = Plugin:CreateToolbar('ROAR AI')

local ConsoleButton = Toolbar:CreateButton(
    'Console',
    'Open ROAR AI web console',
    'rbxasset://textures/Cursors/DragCursor.png'
)

local AnalyzeButton = Toolbar:CreateButton(
    'Analyze',
    'Send selected code to ROAR AI',
    'rbxasset://textures/Cursors/ClosedHand.png'
)

-- Create dock widget
local DockWidgetInfo = DockWidgetPluginGuiInfo.new(
    Enum.InitialDockState.Float,
    true,
    true,
    400,
    500,
    300,
    200
)

local Widget = Plugin:CreateDockWidgetPluginGui('RoarAIWidget', DockWidgetInfo)
Widget.Title = 'ROAR AI - ' .. PLUGIN_VERSION

-- Create UI
local Container = Instance.new('Frame')
Container.Size = UDim2.fromScale(1, 1)
Container.BackgroundColor3 = Color3.fromRGB(13, 13, 20)
Container.BorderSizePixel = 0
Container.Parent = Widget

-- Header
local Header = Instance.new('Frame')
Header.Size = UDim2.new(1, 0, 0, 50)
Header.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
Header.BorderSizePixel = 0
Header.Parent = Container

local Title = Instance.new('TextLabel')
Title.Size = UDim2.new(1, -12, 0, 50)
Title.Position = UDim2.new(0, 12, 0, 0)
Title.BackgroundTransparency = 1
Title.TextColor3 = Color3.fromRGB(255, 255, 255)
Title.Font = Enum.Font.GothamBold
Title.TextSize = 18
Title.TextXAlignment = Enum.TextXAlignment.Left
Title.Text = '🤖 ROAR AI Assistant'
Title.Parent = Header

-- Buttons
local ButtonContainer = Instance.new('Frame')
ButtonContainer.Size = UDim2.new(1, -24, 0, 100)
ButtonContainer.Position = UDim2.new(0, 12, 0, 70)
ButtonContainer.BackgroundTransparency = 1
ButtonContainer.Parent = Container

local function createButton(text, position, backgroundColor)
    local button = Instance.new('TextButton')
    button.Size = UDim2.new(1, 0, 0, 40)
    button.Position = position
    button.BackgroundColor3 = backgroundColor
    button.TextColor3 = Color3.new(1, 1, 1)
    button.Font = Enum.Font.GothamBold
    button.TextSize = 14
    button.Text = text
    button.Parent = ButtonContainer
    
    -- Hover effect
    local originalColor = backgroundColor
    button.MouseEnter:Connect(function()
        button.BackgroundColor3 = Color3.new(
            math.min(1, originalColor.R + 0.1),
            math.min(1, originalColor.G + 0.1),
            math.min(1, originalColor.B + 0.1)
        )
    end)
    
    button.MouseLeave:Connect(function()
        button.BackgroundColor3 = originalColor
    end)
    
    return button
end

local ConsoleBtn = createButton('📖 Open Console', UDim2.new(0, 0, 0, 0), Color3.fromRGB(255, 107, 53))
local AnalyzeBtn = createButton('🔍 Analyze Code', UDim2.new(0, 0, 0, 50), Color3.fromRGB(100, 150, 255))

-- Status display
local StatusFrame = Instance.new('ScrollingFrame')
StatusFrame.Size = UDim2.new(1, -24, 1, -200)
StatusFrame.Position = UDim2.new(0, 12, 0, 185)
StatusFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
StatusFrame.BorderSizePixel = 0
StatusFrame.CanvasSize = UDim2.new(0, 0, 0, 0)
StatusFrame.ScrollBarThickness = 8
StatusFrame.Parent = Container

local Status = Instance.new('TextLabel')
Status.Size = UDim2.fromScale(1, 0)
Status.BackgroundTransparency = 1
Status.TextColor3 = Color3.fromRGB(200, 200, 200)
Status.Font = Enum.Font.Gotham
Status.TextSize = 12
Status.TextWrapped = true
Status.TextXAlignment = Enum.TextXAlignment.Left
Status.TextYAlignment = Enum.TextYAlignment.Top
Status.Text = '✅ ROAR AI Plugin Ready\n\n📝 Instructions:\n1. Select a script in Explorer\n2. Click "Analyze Code"\n3. Check the web console at ' .. BRIDGE_URL
Status.Parent = StatusFrame

-- Update status size
local TextSize = game:GetService('TextService'):GetTextSize(
    Status.Text,
    Status.TextSize,
    Status.Font,
    Vector2.new(StatusFrame.AbsoluteSize.X - 16, 5000)
)
Status.Size = UDim2.new(1, -16, 0, TextSize.Y + 10)
StatusFrame.CanvasSize = UDim2.new(0, 0, 0, TextSize.Y + 20)

local function updateStatus(newText)
    Status.Text = newText
    local newSize = game:GetService('TextService'):GetTextSize(
        Status.Text,
        Status.TextSize,
        Status.Font,
        Vector2.new(StatusFrame.AbsoluteSize.X - 16, 5000)
    )
    Status.Size = UDim2.new(1, -16, 0, newSize.Y + 10)
    StatusFrame.CanvasSize = UDim2.new(0, 0, 0, newSize.Y + 20)
end

-- Helper functions
local function getSelectedScript()
    local selection = Selection:Get()
    if #selection == 0 then
        return nil, 'Select a script in Explorer first'
    end
    
    local instance = selection[1]
    
    -- Check if it's a script
    if instance:IsA('Script') or instance:IsA('LocalScript') or instance:IsA('ModuleScript') then
        return instance, nil
    end
    
    -- Try to find a script child
    for _, child in pairs(instance:GetDescendants()) do
        if child:IsA('Script') or child:IsA('LocalScript') or child:IsA('ModuleScript') then
            return child, nil
        end
    end
    
    return nil, instance.ClassName .. ' is not a script'
end

local function openConsole()
    print('Opening ROAR AI Console at ' .. BRIDGE_URL)
    plugin:OpenBrowserWindow(BRIDGE_URL)
    updateStatus('✅ Console opened in browser\n\nURL: ' .. BRIDGE_URL)
end

local function analyzeCode()
    if not HttpService.HttpEnabled then
        updateStatus('❌ Error:\n\nHTTP requests disabled.\n\nEnable in:\nFile → Settings → HTTP Enabled')
        return
    end
    
    local script, err = getSelectedScript()
    if not script then
        updateStatus('❌ Error:\n\n' .. err)
        return
    end
    
    updateStatus('⏳ Analyzing...\n\nScript: ' .. script.Name .. '\nType: ' .. script.ClassName .. '\nSize: ' .. tostring(#script.Source) .. ' bytes')
    
    local payload = HttpService:JSONEncode({
        model = 'roar-pro',
        source = 'roblox',
        prompt = string.format(
            'Please analyze this Roblox %s and provide suggestions for improvement:\n\n%s',
            script.ClassName,
            script.Source:sub(1, 5000)  -- Limit to 5000 chars
        ),
    })
    
    local success, response = pcall(function()
        return HttpService:PostAsync(BRIDGE_URL .. '/api/roblox', payload, Enum.HttpContentType.ApplicationJson)
    end)
    
    if success then
        local result = HttpService:JSONDecode(response)
        local message = result.response or 'No response'
        
        -- Truncate if too long
        if #message > 500 then
            message = message:sub(1, 497) .. '...'
        end
        
        updateStatus('✅ Analysis Complete\n\n📝 Response:\n\n' .. message .. '\n\n🌐 Open browser console for full response')
        print('\n' .. string.rep('=', 60))
        print('ROAR AI Analysis')
        print(string.rep('=', 60))
        print(result.response)
        print(string.rep('=', 60) .. '\n')
    else
        updateStatus('❌ Connection Failed\n\n' .. tostring(response) .. '\n\nMake sure:\n✓ Ollama is running\n✓ Bridge is running: npm start')
    end
end

-- Button events
ConsoleBtn.MouseButton1Click:Connect(openConsole)
AnalyzeBtn.MouseButton1Click:Connect(analyzeCode)

ConsoleButton.Click:Connect(function()
    Widget.Enabled = not Widget.Enabled
end)

AnalyzeButton.Click:Connect(analyzeCode)

-- Print startup message
print('ROAR AI Plugin loaded v' .. PLUGIN_VERSION)
print('Bridge: ' .. BRIDGE_URL)

