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

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Image ID 1_button'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/a_Rewards'))

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/h2_Rewards'), 0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/h5_Congratulations  Youve unlocked 1 Day Off'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/p_Scan or share the QR code below with HR'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/img_Congratulations  Youve unlocked 1 Day Off_box'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/a_Congratulations  Youve unlocked 1 Day Off_5cf97c'), 
    0)

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/a_Congratulations  Youve unlocked 1 Day Off_5cf97c'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/a_My Profile'))

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/h3_My Badges'), 0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/img_My Badges_badge-image'), 
    0)

WebUI.verifyElementText(findTestObject('Object Repository/Page_Employee Sustainability Page/img_Green Ambassador_badge-image'), 
    '')

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/img_Eco Explorer_badge-image'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/img_Trendsetter_badge-image'), 
    0)

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/div_TrendsetterAwarded for having 3 likes o_447ad1'))


WebUI.rightClick(findTestObject('Object Repository/Page_Employee Sustainability Page/strong_Green Ambassador'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/div_Green AmbassadorAwarded for posting 3 times'))


