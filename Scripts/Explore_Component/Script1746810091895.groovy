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

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/svg'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/a_Explore'))

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_Employee Sustainability Page/select_NewestOldest'), 'oldest', 
    true)

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_Employee Sustainability Page/select_All CategoriesEnvironmentalSocialEconomic'), 
    'Environmental', true)

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_Employee Sustainability Page/select_All CategoriesEnvironmentalSocialEconomic'), 
    'Social', true)

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/a_View Details'))

WebUI.verifyElementText(findTestObject('Object Repository/Page_Employee Sustainability Page/h1_Take the Sustainability Challenge in Kaunas'), 
    'Take the Sustainability Challenge in Kaunas')

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/strong_Posted by'), 0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/span_tag10'), 0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/span_tag5'), 0)

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/div_CommentsPost Commentannacool572025, 110_e6da57'))

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/div_CommentsPost Commentannacool572025, 110_e6da57'), 
    0)

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_n'), 'n')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_nu'), 'nu')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_nuc'), 'nuc')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_nuce'), 'nuce')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_nuc'), 'nuc')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_nu'), 'nu')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_n'), 'n')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_ni'), 'ni')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_nic'), 'nic')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/textarea_nice'), 'nice')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Post Comment'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/img'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Image ID 1_button'))

