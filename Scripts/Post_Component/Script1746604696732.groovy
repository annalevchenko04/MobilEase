import static com.kms.katalon.core.checkpoint.CheckpointFactory.findCheckpoint
import static com.kms.katalon.core.testcase.TestCaseFactory.findTestCase
import static com.kms.katalon.core.testdata.TestDataFactory.findTestData
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import static com.kms.katalon.core.testobject.ObjectRepository.findWindowsObject
import com.kms.katalon.core.checkpoint.Checkpoint as Checkpoint
import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.mobile.keyword.MobileBuiltInKeywords as Mobile
import com.kms.katalon.core.model.FailureHandling as FailureHandling
import com.kms.katalon.core.testcase.TestCase as TestCase
import com.kms.katalon.core.testdata.TestData as TestData
import com.kms.katalon.core.testng.keyword.TestNGBuiltinKeywords as TestNGKW
import com.kms.katalon.core.testobject.TestObject as TestObject
import com.kms.katalon.core.webservice.keyword.WSBuiltInKeywords as WS
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.windows.keyword.WindowsBuiltinKeywords as Windows
import internal.GlobalVariable as GlobalVariable
import org.openqa.selenium.Keys as Keys

WebUI.openBrowser('')

WebUI.navigateToUrl('http://localhost:3000/')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Username_input'), 'anna')

WebUI.setEncryptedText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Password_input'), 'aeHFOx8jV/A=')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/path'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/strong_My Profile'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Create Post'))

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), 'Web1')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/div__ce-paragraph cdx-block'), 'c')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/div__ce-paragraph cdx-block_1'), 'cool page')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/div_cool page'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/svg'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/div_Unordered List'))

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/div_cool page_cdx-list__item-content'), 
    'fff')

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_Employee Sustainability Page/select_SelectEnvironmentalSocialEconomic'), 
    'Social', true)

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), '#tag5')

WebUI.sendKeys(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), Keys.chord(Keys.ENTER))

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), '#tag8')

WebUI.sendKeys(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), Keys.chord(Keys.ENTER))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Image_button is-primary'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_tag5_button is-link is-light is-small'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'))

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), 'post 1555')

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_Employee Sustainability Page/select_SelectEnvironmentalSocialEconomic'), 
    'Economic', true)

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Image ID 1_button'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/h4_post2'))

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_c'), 'c')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_co'), 'co')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_coo'), 'coo')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_cool'), 'cool')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_cool_1'), 'cool!')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Post Comment'))

