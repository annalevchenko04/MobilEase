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

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/a_Back to Register'))

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Username_input'), 'vika')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Name_input'), 'Vika')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Surname_input'), 'Ushkalo')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), '16')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Phone_input'), '+3859668575')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Email Address_input'), 'vika@ktu.lt')

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_Employee Sustainability Page/select_Select GenderMaleFemale'), 
    'female', true)

WebUI.setEncryptedText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Password_input'), 'aeHFOx8jV/A=')

WebUI.setEncryptedText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Confirm Password_input'), 
    'aeHFOx8jV/A=')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/path'))

